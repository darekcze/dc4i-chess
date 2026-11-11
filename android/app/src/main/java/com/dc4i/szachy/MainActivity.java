package com.dc4i.szachy;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import android.widget.Toast;
import android.webkit.WebMessage;
import android.webkit.WebMessagePort;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.Future;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class MainActivity extends BridgeActivity {
    private static final int MAX_BYTES = 2 * 1024 * 1024;
    private static final int MAX_RETRIES = 50;
    private static final long READ_TIMEOUT_MS = 10000;
    private static final String PROCESS_ID = UUID.randomUUID().toString();
    private static final String STATE_PROCESS = "shareProcess";
    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    // A malicious provider may ignore interruption. At most two such reads can be stuck.
    private static final ThreadPoolExecutor READERS = new ThreadPoolExecutor(0, 2, 30,
        TimeUnit.SECONDS, new SynchronousQueue<>());
    private static final Queue<Share> PENDING = new ArrayDeque<>();
    private static WeakReference<MainActivity> current = new WeakReference<>(null);
    private boolean delivering;
    private boolean destroyed;
    private int retries;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        current = new WeakReference<>(this);
        for (Share share : PENDING) { share.delivered = false; share.offset = 0; }
        if (state == null || !PROCESS_ID.equals(state.getString(STATE_PROCESS))) receive(getIntent());
        clearLaunchIntent();
        deliver();
    }

    @Override
    public void onSaveInstanceState(Bundle state) {
        state.putString(STATE_PROCESS, PROCESS_ID);
        super.onSaveInstanceState(state);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        receive(intent);
        clearLaunchIntent();
        retries = 0;
        deliver();
    }

    private void clearLaunchIntent() {
        // Never place a multi-megabyte incoming Intent in saved Activity state.
        setIntent(new Intent(this, MainActivity.class));
    }

    @Override
    public void onResume() {
        super.onResume();
        retries = 0;
        deliver();
    }

    private void receive(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String type = intent.getType();
        if (!"text/plain".equals(type) && !"application/x-chess-pgn".equals(type)) return;
        Share share = new Share();
        PENDING.add(share); // Reserve the arrival order before starting concurrent reads.
        Context context = getApplicationContext();
        // Plain text needs no provider I/O and remains usable even if both readers are stuck.
        if (intent.getParcelableExtra(Intent.EXTRA_STREAM) == null) {
            completeRead(share, readPayload(context, intent));
            return;
        }
        try {
            Future<?> read = READERS.submit(() -> {
                JSONObject payload = readPayload(context, intent);
                MAIN.post(() -> completeRead(share, payload));
            });
            MAIN.postDelayed(() -> {
                if (share.json == null) {
                    read.cancel(true);
                    completeRead(share, errorPayload("timeout"));
                }
            }, READ_TIMEOUT_MS);
        } catch (RejectedExecutionException e) {
            completeRead(share, errorPayload("timeout"));
        }
    }

    private static void completeRead(Share share, JSONObject payload) {
        if (share.json != null) return; // A timed-out provider may eventually return.
        share.json = payload.toString();
        MainActivity activity = current.get();
        if (activity != null) activity.deliver();
    }

    private static JSONObject readPayload(Context context, Intent intent) {
        JSONObject payload = new JSONObject();
        try {
            Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            String text;
            if (uri != null) {
                if (!"content".equals(uri.getScheme())) throw new IllegalArgumentException();
                try (InputStream in = context.getContentResolver().openInputStream(uri);
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
            return errorPayload("too_large");
        } catch (CharacterCodingException e) {
            return errorPayload("invalid");
        } catch (Exception e) {
            return errorPayload("unreadable");
        }
        return payload;
    }

    private static JSONObject errorPayload(String error) {
        JSONObject payload = new JSONObject();
        try { payload.put("error", error); } catch (Exception ignored) { }
        return payload;
    }

    private static class TooLarge extends Exception { }
    private static class Share {
        final String id = UUID.randomUUID().toString();
        String json;
        int offset;
        boolean delivered;
    }

    private void deliver() {
        if (destroyed || delivering || PENDING.isEmpty()) return;
        Share share = null;
        for (Share candidate : PENDING) {
            if (!candidate.delivered) { share = candidate; break; }
        }
        if (share == null || share.json == null) return;
        final Share item = share;
        WebView webView = getBridge() == null ? null : getBridge().getWebView();
        if (webView == null) { retry(); return; }
        int end = Math.min(share.offset + 16384, share.json.length());
        if (end < share.json.length() && Character.isHighSurrogate(share.json.charAt(end - 1))) end--;
        final int next = end;
        boolean last = end == share.json.length();
        delivering = true;
        String js = "(function(){try{if(location.origin!=='https://localhost'||document.readyState==='loading')return false;"
            + "if(!window.__szachyNativePort){if(!window.__szachyPortListener){window.__szachyPortListener=true;"
            + "window.addEventListener('message',function(e){if(e.data==='szachy-share-port'&&e.ports.length)window.__szachyNativePort=e.ports[0]})}return 'setup';}"
            + "if(location.hash!=='#/import'){location.hash='#/import';return false;}"
            + "if(typeof window.__szachyEnqueueShare!=='function')return false;"
            + "var id=" + JSONObject.quote(share.id) + ",s=window.__szachyShare;"
            + (share.offset == 0 ? "s=window.__szachyShare={id:id,text:''};" : "if(!s||s.id!==id)return false;")
            + "s.text+=" + JSONObject.quote(share.json.substring(share.offset, end)) + ";"
            + (last ? "var p=JSON.parse(s.text);p.id=id;window.__szachyEnqueueShare(p);delete window.__szachyShare;" : "")
            + "return true}catch(e){return false}})()";
        webView.evaluateJavascript(js, result -> {
            delivering = false;
            if (destroyed) return;
            if ("\"setup\"".equals(result)) {
                WebMessagePort[] ports = webView.createWebMessageChannel();
                ports[0].setWebMessageCallback(new WebMessagePort.WebMessageCallback() {
                    @Override
                    public void onMessage(WebMessagePort port, WebMessage message) {
                        String id = message.getData();
                        if (id != null) PENDING.removeIf(queued -> queued.id.equals(id));
                        MainActivity activity = current.get();
                        if (activity != null) activity.deliver();
                    }
                });
                webView.postWebMessage(new WebMessage("szachy-share-port", new WebMessagePort[]{ports[1]}),
                    Uri.parse("https://localhost"));
                retry();
            } else if ("true".equals(result)) {
                retries = 0;
                item.offset = next;
                if (last) item.delivered = true;
                MAIN.post(this::deliver);
            } else {
                item.offset = 0;
                retry();
            }
        });
    }

    private void retry() {
        if (destroyed) return;
        if (++retries <= MAX_RETRIES) MAIN.postDelayed(this::deliver, 200);
        else Toast.makeText(this, "Could not open shared game. Reopen the app to retry.", Toast.LENGTH_LONG).show();
    }

    @Override
    public void onDestroy() {
        destroyed = true;
        if (current.get() == this) current.clear();
        // A new WebView must receive each unfinished payload from its beginning.
        for (Share share : PENDING) share.offset = 0;
        super.onDestroy();
    }
}
