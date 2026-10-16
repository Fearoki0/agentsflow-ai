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

            // File Chooser for image and document attachments
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Cannot open file chooser", Toast.LENGTH_SHORT).show();
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
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{
                        Manifest.permission.RECORD_AUDIO,
                        Manifest.permission.READ_EXTERNAL_STORAGE,
                        Manifest.permission.WRITE_EXTERNAL_STORAGE
                }, PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.getVisibility() == View.VISIBLE && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        retryHandler.removeCallbacks(retryRunnable);
        super.onDestroy();
    }
}
