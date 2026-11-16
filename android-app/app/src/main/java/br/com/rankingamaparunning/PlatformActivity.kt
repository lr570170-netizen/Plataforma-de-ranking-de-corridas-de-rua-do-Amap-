package br.com.rankingamaparunning

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebResourceRequest
import android.webkit.ValueCallback
import android.widget.LinearLayout
import android.widget.Button
import android.widget.Toast

class PlatformActivity : Activity() {
    private lateinit var web: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val fileRequest = 321
    private val home = "https://ranking-amapa-running.netlify.app/"
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val controls = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        controls.addView(Button(this).apply { text = "Início"; setOnClickListener { web.loadUrl(home) } }, LinearLayout.LayoutParams(0, -2, 1f))
        controls.addView(Button(this).apply { text = "Treino GPS"; setOnClickListener { startActivity(Intent(this@PlatformActivity, MainActivity::class.java)) } }, LinearLayout.LayoutParams(0, -2, 1f))
        controls.addView(Button(this).apply { text = "Navegador"; setOnClickListener { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(web.url ?: home))) } }, LinearLayout.LayoutParams(0, -2, 1f))
        web = WebView(this)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.allowFileAccess = false
        web.settings.allowContentAccess = true
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                if (url.scheme == "https" && url.host == "ranking-amapa-running.netlify.app") return false
                if (url.scheme == "https" || url.scheme == "mailto" || url.scheme == "tel") {
                    try { startActivity(Intent(Intent.ACTION_VIEW, url)) } catch (_: Exception) { Toast.makeText(this@PlatformActivity, "Não foi possível abrir o link.", Toast.LENGTH_SHORT).show() }
                }
                return true
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                return try {
                    startActivityForResult(params.createIntent(), fileRequest)
                    true
                } catch (_: Exception) {
                    fileCallback = null
                    callback.onReceiveValue(null)
                    false
                }
            }
        }
        layout.addView(controls)
        layout.addView(web, LinearLayout.LayoutParams(-1, 0, 1f))
        setContentView(layout)
        web.loadUrl(home)
    }
    @Deprecated("Deprecated in Android API")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == fileRequest) {
            fileCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data))
            fileCallback = null
        }
    }
    @Deprecated("Deprecated in Android API")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }
    override fun onDestroy() {
        fileCallback?.onReceiveValue(null)
        fileCallback = null
        web.destroy()
        super.onDestroy()
    }
}
