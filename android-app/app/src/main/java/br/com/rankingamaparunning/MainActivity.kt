package br.com.rankingamaparunning

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private lateinit var status: TextView
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(36, 60, 36, 36) }
        status = TextView(this).apply { text = "Treino GPS • Masculino e Feminino\nPronto para iniciar" }
        val start = Button(this).apply { text = "▶ Iniciar treino"; setOnClickListener { startTraining() } }
        val stop = Button(this).apply { text = "■ Encerrar treino"; setOnClickListener {
            startService(Intent(this@MainActivity, GpsTrackingService::class.java).setAction(GpsTrackingService.STOP))
            status.text = "Treino encerrado. Confira o resumo na notificação."
        } }
        layout.addView(status); layout.addView(start); layout.addView(stop)
        setContentView(layout)
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
        status.text = "Treino em andamento. O GPS continua com a tela bloqueada enquanto o serviço estiver ativo."
    }
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 10 && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) startTraining()
    }
}
