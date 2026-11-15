package br.com.rankingamaparunning

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONArray
import java.util.Locale

class MainActivity : Activity() {
    private lateinit var status: TextView
    private lateinit var history: TextView
    private lateinit var metrics: TextView
    private lateinit var totals: TextView
    private val refreshHandler = android.os.Handler(android.os.Looper.getMainLooper())
    private val refreshTicker = object : Runnable {
        override fun run() {
            if (::status.isInitialized) refresh()
            refreshHandler.postDelayed(this, 3000L)
        }
    }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20), dp(30), dp(20), dp(20)) }
        val heading = TextView(this).apply { text = "Ranking Amapá Running\nTreino GPS em segundo plano"; textSize = 23f }
        status = TextView(this)
        history = TextView(this)
        metrics = TextView(this).apply { textSize = 21f; setTypeface(null, Typeface.BOLD); setTextColor(Color.rgb(12,66,86)); setPadding(dp(16),dp(18),dp(16),dp(18)); background = panel() }
        totals = TextView(this).apply { textSize = 19f; setTypeface(null, Typeface.BOLD); setTextColor(Color.rgb(12,66,86)); setPadding(dp(16),dp(18),dp(16),dp(18)); background = panel() }
        heading.setTypeface(null, Typeface.BOLD)
        layout.setBackgroundColor(Color.rgb(243,247,250))
        val start = Button(this).apply { text = "▶ Iniciar treino"; setOnClickListener { startTraining() } }
        val stop = Button(this).apply { text = "■ Encerrar e salvar"; setOnClickListener {
            startService(Intent(this@MainActivity, GpsTrackingService::class.java).setAction(GpsTrackingService.STOP))
            status.text = "Encerrando treino. Toque em Atualizar para ver o resumo."
        } }
        val refresh = Button(this).apply { text = "↻ Atualizar resultados"; setOnClickListener { refresh() } }
        val website = Button(this).apply { text = "Abrir ranking masculino e feminino"; setOnClickListener {
            startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://ranking-amapa-running.netlify.app/")))
        } }
        listOf(heading, status, section("DADOS DO TREINO"), metrics, start, stop, refresh, section("RESUMO ACUMULADO"), totals, section("HISTÓRICO"), history, website).forEach(layout::addView)
        setContentView(ScrollView(this).apply { addView(layout) })
        refresh()
    }
    override fun onResume() {
        super.onResume()
        refreshHandler.removeCallbacks(refreshTicker)
        refreshTicker.run()
    }
    override fun onPause() {
        refreshHandler.removeCallbacks(refreshTicker)
        super.onPause()
    }
    private fun refresh() {
        val prefs = getSharedPreferences(GpsTrackingService.STORE, MODE_PRIVATE)
        val active = prefs.getBoolean("ativo", false)
        val meters = prefs.getFloat(if(active) "atual_metros" else "ultimo_metros", 0f)
        val seconds = prefs.getLong(if(active) "atual_segundos" else "ultimo_segundos", 0L)
        status.text = String.format(Locale.getDefault(), "%s\nDistância: %.2f km\nTempo: %d:%02d\nRitmo: %s",
            if(active) "Treino iniciado • acompanhe pela notificação" else "Pronto para treinar",
            meters / 1000, seconds / 60, seconds % 60,
            if (meters >= 10f) {
                val pace = (seconds / (meters / 1000.0)).toInt()
                String.format(Locale.getDefault(), "%d:%02d min/km", pace / 60, pace % 60)
            } else "--")
        val km = meters.toDouble() / 1000.0
        val kmh = if (seconds > 0) km * 3600.0 / seconds else 0.0
        val paceText = if (km > 0.0 && seconds > 0) duration((seconds / km).toLong()) + " min/km" else "--"
        metrics.text = String.format(Locale.getDefault(),
            "DISTÂNCIA\n%.2f km\n\nTEMPO\n%s\n\nRITMO MÉDIO\n%s\n\nVELOCIDADE MÉDIA\n%.2f km/h\n\nPONTOS DO TREINO\n%.2f pts",
            km, duration(seconds), paceText, kmh, pontos(meters.toDouble(), seconds))
        val entries = try { JSONArray(prefs.getString("historico", "[]")) } catch (_: Exception) { JSONArray() }
        val sb = StringBuilder("\nHistórico salvo no aparelho\n")
        for(i in entries.length()-1 downTo maxOf(0, entries.length()-10)) {
            val e = entries.optJSONObject(i) ?: continue
            sb.append(String.format(Locale.getDefault(), "• %.2f km em %d:%02d — %.2f pontos\n",
                e.optDouble("distancia_m")/1000, e.optLong("duracao_s")/60, e.optLong("duracao_s")%60, pontos(e.optDouble("distancia_m"),e.optLong("duracao_s"))))
        }
        if(entries.length()==0) sb.append("Nenhum treino concluído.")
        var total = 0.0
        for (i in 0 until entries.length()) {
            val e = entries.optJSONObject(i) ?: continue
            if (e.optDouble("distancia_m") >= 10.0 && e.optLong("duracao_s") >= 30 && e.optInt("amostras") >= 3) total += pontos(e.optDouble("distancia_m"), e.optLong("duracao_s"))
        }
        sb.append(String.format(Locale.getDefault(), "\nTotal acumulado: %.2f pontos", total))
        sb.append("\n\nOs treinos ainda não são enviados ao ranking online.")
        totals.text = String.format(Locale.getDefault(), "PONTOS ACUMULADOS\n%.2f pts\n\nTREINOS REGISTRADOS\n%d", total, entries.length())
        history.text = sb.toString()
    }
    private fun duration(seconds: Long): String = if (seconds >= 3600) String.format(Locale.getDefault(), "%d:%02d:%02d", seconds/3600, (seconds%3600)/60, seconds%60) else String.format(Locale.getDefault(), "%02d:%02d", seconds/60, seconds%60)
    private fun panel(): GradientDrawable = GradientDrawable().apply { setColor(Color.WHITE); cornerRadius = dp(14).toFloat() }
    private fun section(name: String): TextView = TextView(this).apply { text = name; textSize = 14f; setTypeface(null, Typeface.BOLD); setTextColor(Color.rgb(35,76,95)); setPadding(0, dp(18), 0, dp(8)) }
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density + 0.5f).toInt()
    private fun pontos(metros: Double, segundos: Long): Double = if (segundos > 0) 10.0 * (metros / 1000.0) + 5.0 * (metros / 1000.0 * 3600.0 / segundos) else 0.0
    private fun startTraining() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), 10)
            return
        }
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 11)
        }
        startForegroundService(Intent(this, GpsTrackingService::class.java).setAction(GpsTrackingService.START))
        status.text = "Treino iniciado. GPS em segundo plano com notificação persistente."
    }
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 10 && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) startTraining()
    }
}
