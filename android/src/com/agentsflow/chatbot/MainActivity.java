/*
 * AgentsFlow AI - Universal Mobile AI Platform
 * Copyright (C) 2026 Saad (@fearoki). All Rights Reserved.
 *
 * Strict Proprietary & Source-Available License.
 * Unauthorized copying, modification, reverse engineering, redistribution,
 * or commercial exploitation without prior written consent from Saad is strictly prohibited.
 */

package com.agentsflow.chatbot;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.app.DownloadManager;
import android.os.Environment;
import android.util.Base64;
import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.List;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final String PREFS_NAME = "agentsflow_prefs";
    private static final String PREF_SERVER_URL = "server_url";
    private static final String DEFAULT_URL = "file:///android_asset/index.html";
    private static final int PERMISSION_REQUEST_CODE = 101;
    private static final int FILE_CHOOSER_REQUEST_CODE = 102;

    private WebView webView;
    private LinearLayout loadingLayout;
    private TextView statusText;
    private Button retryButton;
    private Button editUrlButton;
    private ValueCallback<Uri[]> filePathCallback;

    private String currentServerUrl;
    private boolean hasError = false;
    private Handler retryHandler = new Handler(Looper.getMainLooper());
    private Runnable retryRunnable = new Runnable() {
        @Override
        public void run() {
            if (hasError && (webView.getVisibility() != View.VISIBLE)) {
                loadChatbot();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.activity_main);

        // 2026 Obsidian Matte Status & Navigation Bar
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(0xFF0D0D0F);
            window.setNavigationBarColor(0xFF0D0D0F);
        }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        currentServerUrl = prefs.getString(PREF_SERVER_URL, DEFAULT_URL);
        // Force upgrade to standalone independent asset mode
        if (currentServerUrl.contains("127.0.0.1") || currentServerUrl.contains("localhost")) {
            currentServerUrl = DEFAULT_URL;
            prefs.edit().putString(PREF_SERVER_URL, DEFAULT_URL).apply();
        }

        webView = (WebView) findViewById(R.id.webview);
        loadingLayout = (LinearLayout) findViewById(R.id.loading_layout);
        statusText = (TextView) findViewById(R.id.status_text);
        retryButton = (Button) findViewById(R.id.retry_button);
        editUrlButton = (Button) findViewById(R.id.edit_url_button);

        setupWebView();
        checkPermissions();

        retryButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                hasError = false;
                loadChatbot();
            }
        });

        editUrlButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showEditUrlDialog();
            }
        });

        loadChatbot();
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(false);
        }

        webView.setBackgroundColor(0xFF0D0D0F);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Native Android Bridge for reliable media download & storage access
        webView.addJavascriptInterface(new WebAppInterface(), "AndroidBridge");

        // Download listener for audio, image, video and file downloads
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                try {
                    if (url != null && url.startsWith("data:")) {
                        saveDataUriToFile(url, "agentsflow_download_" + System.currentTimeMillis());
                        return;
                    }
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    if (mimeType != null) {
                        request.setMimeType(mimeType);
                    }
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    String fileName = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
                    DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(MainActivity.this, "Downloading " + fileName + "...", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Download: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                if (!"about:blank".equals(url)) {
                    hasError = false;
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (!hasError && !"about:blank".equals(url)) {
                    loadingLayout.setVisibility(View.GONE);
                    webView.setVisibility(View.VISIBLE);
                }
            }

            // Android 6.0+ (API 23+)
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    handleConnectionFailure();
                }
            }

            // Legacy API for older devices
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                if (failingUrl != null && failingUrl.equals(currentServerUrl)) {
                    handleConnectionFailure();
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                android.util.Log.d("AgentsFlowWeb", consoleMessage.message() + " [" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + "]");
                return true;
            }

            // Auto-grant microphone for Voice Dictation (STT) and Web Speech
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        request.grant(request.getResources());
                    }
                });
            }

            // File Chooser for image, document, and OCR vision attachments
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                    MainActivity.this.filePathCallback = null;
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = null;
                if (fileChooserParams != null) {
                    try {
                        intent = fileChooserParams.createIntent();
                    } catch (Exception ignored) {}
                }
                if (intent == null) {
                    intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("image/*");
                }

                try {
                    Intent chooser = Intent.createChooser(intent, "Choose Image or Document");
                    startActivityForResult(chooser, FILE_CHOOSER_REQUEST_CODE);
                } catch (Exception e) {
                    if (MainActivity.this.filePathCallback != null) {
                        MainActivity.this.filePathCallback.onReceiveValue(null);
                        MainActivity.this.filePathCallback = null;
                    }
                    Toast.makeText(MainActivity.this, "Cannot open file chooser: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });
    }

    private void handleConnectionFailure() {
        hasError = true;
        webView.stopLoading();

        if (currentServerUrl != null && currentServerUrl.startsWith("file:///")) {
            loadingLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            return;
        }

        webView.loadUrl("about:blank");
        webView.setVisibility(View.GONE);
        loadingLayout.setVisibility(View.VISIBLE);

        statusText.setText("Waiting for AgentsFlow server...\n\nStart in Termux:\nbash scripts/run_mobile.sh\n\nTarget: " + currentServerUrl + "\nAuto-reconnecting...");
        
        // Auto-retry polling every 3.5 seconds
        retryHandler.removeCallbacks(retryRunnable);
        retryHandler.postDelayed(retryRunnable, 3500);
    }

    private void loadChatbot() {
        retryHandler.removeCallbacks(retryRunnable);
        if (currentServerUrl != null && currentServerUrl.startsWith("file:///")) {
            loadingLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
        } else {
            loadingLayout.setVisibility(View.VISIBLE);
            statusText.setText("Connecting to " + currentServerUrl + "...");
        }
        webView.loadUrl(currentServerUrl);
    }

    private void showEditUrlDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK);
        builder.setTitle("Server URL Configuration");

        final EditText input = new EditText(this);
        input.setText(currentServerUrl);
        input.setHint("http://127.0.0.1:3000 or http://192.168.x.x:3000");
        input.setTextColor(0xFFFFFFFF);
        builder.setView(input);

        builder.setPositiveButton("Save & Connect", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                String newUrl = input.getText().toString().trim();
                if (!newUrl.isEmpty()) {
                    currentServerUrl = newUrl;
                    SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
                    prefs.edit().putString(PREF_SERVER_URL, currentServerUrl).apply();
                    hasError = false;
                    loadChatbot();
                }
            }
        });

        builder.setNeutralButton("Reset Default", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                currentServerUrl = DEFAULT_URL;
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
                prefs.edit().putString(PREF_SERVER_URL, currentServerUrl).apply();
                hasError = false;
                loadChatbot();
            }
        });

        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    private void checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> needed = new ArrayList<String>();
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.RECORD_AUDIO);
            }
            if (Build.VERSION.SDK_INT >= 33) {
                if (checkSelfPermission("android.permission.READ_MEDIA_IMAGES") != PackageManager.PERMISSION_GRANTED) {
                    needed.add("android.permission.READ_MEDIA_IMAGES");
                }
                if (checkSelfPermission("android.permission.READ_MEDIA_VIDEO") != PackageManager.PERMISSION_GRANTED) {
                    needed.add("android.permission.READ_MEDIA_VIDEO");
                }
            } else {
                if (checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    needed.add(Manifest.permission.READ_EXTERNAL_STORAGE);
                }
                if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    needed.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
                }
            }
            if (!needed.isEmpty()) {
                requestPermissions(needed.toArray(new String[0]), PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    if (data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    } else if (data.getDataString() != null) {
                        results = new Uri[]{Uri.parse(data.getDataString())};
                    } else if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        if (count > 0) {
                            results = new Uri[count];
                            for (int i = 0; i < count; i++) {
                                results[i] = data.getClipData().getItemAt(i).getUri();
                            }
                        }
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    // Native Bridge interface exposed to JavaScript
    public class WebAppInterface {
        @JavascriptInterface
        public boolean isAndroidApp() {
            return true;
        }

        @JavascriptInterface
        public void downloadBase64File(final String base64Data, final String filename, final String mimeType) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    saveBase64ToDownloads(base64Data, filename, mimeType);
                }
            });
        }

        @JavascriptInterface
        public void saveDataUriToFile(final String dataUri, final String defaultName) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    MainActivity.this.saveDataUriToFile(dataUri, defaultName);
                }
            });
        }
    }

    private void saveDataUriToFile(String dataUri, String defaultName) {
        try {
            int commaIdx = dataUri.indexOf(",");
            if (commaIdx == -1) return;
            String meta = dataUri.substring(0, commaIdx);
            String base64 = dataUri.substring(commaIdx + 1);
            String mimeType = "image/png";
            String ext = ".png";
            if (meta.contains("image/jpeg") || meta.contains("image/jpg")) {
                mimeType = "image/jpeg";
                ext = ".jpg";
            } else if (meta.contains("video/mp4")) {
                mimeType = "video/mp4";
                ext = ".mp4";
            } else if (meta.contains("audio/")) {
                mimeType = "audio/mp3";
                ext = ".mp3";
            }
            saveBase64ToDownloads(base64, defaultName + ext, mimeType);
        } catch (Exception e) {
            Toast.makeText(MainActivity.this, "Save error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void saveBase64ToDownloads(String base64Data, String filename, String mimeType) {
        try {
            String clean = base64Data;
            int commaIdx = clean.indexOf(",");
            if (commaIdx != -1) {
                clean = clean.substring(commaIdx + 1);
            }
            byte[] bytes = Base64.decode(clean, Base64.DEFAULT);

            File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File dest = new File(dir, filename);
            FileOutputStream fos = new FileOutputStream(dest);
            fos.write(bytes);
            fos.flush();
            fos.close();

            // Refresh Android Media Scanner so it appears instantly in Gallery/Downloads
            sendBroadcast(new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, Uri.fromFile(dest)));
            Toast.makeText(MainActivity.this, "Saved to Downloads: " + filename, Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(MainActivity.this, "Save error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.getVisibility() == View.VISIBLE) {
            webView.evaluateJavascript("typeof window.afHandleAndroidBack === 'function' ? window.afHandleAndroidBack() : false;", new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    if ("true".equals(value)) {
                        // Modal or sidebar was dismissed cleanly
                        return;
                    }
                    if (webView.canGoBack()) {
                        webView.goBack();
                    } else {
                        MainActivity.super.onBackPressed();
                    }
                }
            });
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        retryHandler.removeCallbacks(retryRunnable);
        super.onDestroy();
    }
}
