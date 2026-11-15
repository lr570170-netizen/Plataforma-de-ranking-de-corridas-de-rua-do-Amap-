package br.com.rankingamaparunning

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONArray
import java.util.Locale

class MainActivity : Activity() {
    private lateinit var status: TextView
    private lateinit var history: TextView
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(36, 60, 36, 36) }
        val heading = TextView(this).apply { text = "Ranking Amapá Running\nTreino GPS em segundo plano"; textSize = 23f }
        status = TextView(this)
        history = TextView(this)
        val start = Button(this).apply { text = "▶ Iniciar treino"; setOnClickListener { startTraining() } }
        val stop = Button(this).apply { text = "■ Encerrar e salvar"; setOnClickListener {
            startService(Intent(this@MainActivity, GpsTrackingService::class.java).setAction(GpsTrackingService.STOP))
            status.text = "Encerrando treino. Toque em Atualizar para ver o resumo."
        } }
        val refresh = Button(this).apply { text = "↻ Atualizar resultados"; setOnClickListener { refresh() } }
        val website = Button(this).apply { text = "Abrir ranking masculino e feminino"; setOnClickListener {
            startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://ranking-amapa-running.netlify.app/")))
        } }
        listOf(heading, status, start, stop, refresh, website, history).forEach(layout::addView)
        setContentView(ScrollView(this).apply { addView(layout) })
        refresh()
    }
    override fun onResume() { super.onResume(); if (::status.isInitialized) refresh() }
    private fun refresh() {
        val prefs = getSharedPreferences(GpsTrackingService.STORE, MODE_PRIVATE)
        val active = prefs.getBoolean("ativo", false)
        val meters = prefs.getFloat(if(active) "atual_metros" else "ultimo_metros", 0f)
        val seconds = prefs.getLong(if(active) "atual_segundos" else "ultimo_segundos", 0L)
        status.text = String.format(Locale.getDefault(), "%s\nDistância: %.2f km\nTempo: %d:%02d",
            if(active) "Treino iniciado • acompanhe pela notificação" else "Pronto para treinar",
            meters / 1000, seconds / 60, seconds % 60)
        val entries = try { JSONArray(prefs.getString("historico", "[]")) } catch (_: Exception) { JSONArray() }
        val sb = StringBuilder("\nHistórico salvo no aparelho\n")
        for(i in entries.length()-1 downTo maxOf(0, entries.length()-10)) {
            val e = entries.optJSONObject(i) ?: continue
            sb.append(String.format(Locale.getDefault(), "• %.2f km em %d:%02d\n",
                e.optDouble("distancia_m")/1000, e.optLong("duracao_s")/60, e.optLong("duracao_s")%60))
        }
        if(entries.length()==0) sb.append("Nenhum treino concluído.")
        sb.append("\n\nOs treinos ainda não são enviados ao ranking online.")
        history.text = sb.toString()
    }
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
