package com.dc4i.szachy;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
    private static final int MAX_BYTES = 2 * 1024 * 1024;
    private final ExecutorService reader = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Queue<Share> pending = new ArrayDeque<>();
    private boolean delivering = false;
    private boolean destroyed = false;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        receive(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        receive(intent);
    }

    private void receive(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String type = intent.getType();
        if (!"text/plain".equals(type) && !"application/x-chess-pgn".equals(type)) return;
        // Retain the intent grant while the single reader processes incoming shares in order.
        reader.execute(() -> {
            JSONObject payload = new JSONObject();
            try {
                Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                String text;
                if (uri != null) {
                    if (!"content".equals(uri.getScheme())) throw new IllegalArgumentException();
                    try (InputStream in = getContentResolver().openInputStream(uri);
                         ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                        if (in == null) throw new IllegalArgumentException();
                        byte[] buf = new byte[8192];
                        int count;
                        while ((count = in.read(buf)) != -1) {
                            if (out.size() + count > MAX_BYTES) throw new TooLarge();
                            out.write(buf, 0, count);
                        }
                        text = StandardCharsets.UTF_8.newDecoder()
                            .onMalformedInput(CodingErrorAction.REPORT)
                            .onUnmappableCharacter(CodingErrorAction.REPORT)
                            .decode(ByteBuffer.wrap(out.toByteArray())).toString();
                    }
                } else {
                    CharSequence shared = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
                    if (shared == null) throw new IllegalArgumentException();
                    text = shared.toString();
                    if (text.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) throw new TooLarge();
                }
                payload.put("text", text);
            } catch (TooLarge e) {
                putError(payload, "too_large");
            } catch (CharacterCodingException e) {
                putError(payload, "invalid");
            } catch (Exception e) {
                putError(payload, "unreadable");
            }
            Share share = new Share(payload.toString());
            main.post(() -> { if (!destroyed) { pending.add(share); deliver(); } });
        });
    }

    private static void putError(JSONObject payload, String error) {
        try { payload.put("error", error); } catch (Exception ignored) { }
    }

    private static class TooLarge extends Exception { }

    private static class Share {
        final String id = UUID.randomUUID().toString();
        final String json;
        int offset = 0;
        Share(String json) { this.json = json; }
    }

    private void deliver() {
        if (destroyed || delivering || pending.isEmpty()) return;
        WebView webView = getBridge() == null ? null : getBridge().getWebView();
        if (webView == null) { main.postDelayed(this::deliver, 200); return; }
        Share share = pending.peek();
        int end = Math.min(share.offset + 16384, share.json.length());
        if (end < share.json.length() && Character.isHighSurrogate(share.json.charAt(end - 1))) end--;
        final int next = end;
        boolean last = end == share.json.length();
        delivering = true;
        // Each piece is a quoted JSON string literal, never executable raw share text.
        String id = JSONObject.quote(share.id);
        String part = JSONObject.quote(share.json.substring(share.offset, end));
        String js = "(function(){try{if(location.hostname!=='localhost'||document.readyState==='loading')return false;"
            + "var id=" + id + ",s=window.__szachyShare;"
            + (share.offset == 0 ? "s=window.__szachyShare={id:id,text:''};" : "if(!s||s.id!==id)return false;")
            + "s.text+=" + part + ";"
            + (last ? "var k='szachy-pending-shares',q=JSON.parse(sessionStorage.getItem(k)||'[]');"
                + "if(!q.some(function(x){return x.id===id})){var p=JSON.parse(s.text);p.id=id;q.push(p);sessionStorage.setItem(k,JSON.stringify(q));}"
                + "delete window.__szachyShare;window.dispatchEvent(new Event('szachy-shared-pgn'));location.hash='#/import';" : "")
            + "return true}catch(e){return false}})()";
        webView.evaluateJavascript(js, result -> {
            delivering = false;
            if (destroyed) return;
            if ("true".equals(result)) {
                share.offset = next;
                if (last) pending.remove();
            } else {
                // The page may have reloaded while a chunk was in flight.
                share.offset = 0;
            }
            main.postDelayed(this::deliver, "true".equals(result) ? 0 : 200);
        });
    }

    @Override
    public void onDestroy() {
        destroyed = true;
        main.removeCallbacksAndMessages(null);
        reader.shutdownNow();
        super.onDestroy();
    }
}
