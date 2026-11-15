package br.com.rankingamaparunning

import android.Manifest
import android.app.*
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.*
import com.google.android.gms.location.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

class GpsTrackingService : Service() {
    companion object {
        const val START = "GPS_START"
        const val STOP = "GPS_STOP"
        const val CHANNEL = "treino_gps"
        const val NOTIFICATION_ID = 41
        const val STORE = "treinos"
    }
    private lateinit var fused: FusedLocationProviderClient
    private var callback: LocationCallback? = null
    private var previous: Location? = null
    private var meters = 0.0
    private var startedAt = 0L
    private var startedWall = 0L
    private var samples = 0
    private val route = JSONArray()
    private var lastSavedAt = 0L
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        fused = LocationServices.getFusedLocationProviderClient(this)
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(
            NotificationChannel(CHANNEL, "Treino GPS em andamento", NotificationManager.IMPORTANCE_LOW))
    }
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            STOP -> { stopTracking(); stopSelf(); return START_NOT_STICKY }
            START -> if (callback == null) {
                startedAt = SystemClock.elapsedRealtime()
                startedWall = System.currentTimeMillis()
                meters = 0.0; samples = 0; previous = null
                getSharedPreferences(STORE, MODE_PRIVATE).edit().putBoolean("ativo", true).apply()
                startForeground(NOTIFICATION_ID, notification("Aguardando sinal GPS"))
                beginTracking()
            }
        }
        return START_NOT_STICKY
    }
    private fun notification(text: String): Notification {
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val stop = PendingIntent.getService(this, 1, Intent(this, GpsTrackingService::class.java).setAction(STOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        return Notification.Builder(this, CHANNEL).setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle("Ranking Amapá Running").setContentText(text)
            .setContentIntent(open).addAction(android.R.drawable.ic_media_pause, "Encerrar", stop)
            .setOngoing(true).build()
    }
    private fun beginTracking() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            getSharedPreferences(STORE, MODE_PRIVATE).edit().putBoolean("ativo", false).apply()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return
        }
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 1000L)
            .setMinUpdateIntervalMillis(1000L).setMinUpdateDistanceMeters(2f).build()
        callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                for (loc in result.locations) accept(loc)
            }
        }
        fused.requestLocationUpdates(request, callback!!, mainLooper)
    }
    private fun accept(loc: Location) {
        if (!loc.hasAccuracy() || loc.accuracy > 20f || loc.isFromMockProvider) return
        val last = previous
        if (last != null) {
            val dt = (loc.elapsedRealtimeNanos - last.elapsedRealtimeNanos) / 1_000_000_000.0
            if (dt <= 0) return
            if (dt > 30) { previous = loc; return }
            val distance = last.distanceTo(loc).toDouble()
            val jitter = maxOf(5.0, minOf(12.0, (last.accuracy + loc.accuracy) * 0.25))
            if (distance <= jitter) return
            if (distance / dt > 7.5) { previous = loc; return }
            meters += distance
        }
        previous = loc
        samples++
        route.put(JSONObject().put("lat", loc.latitude).put("lon", loc.longitude)
            .put("time", loc.time).put("accuracy", loc.accuracy))
        if (SystemClock.elapsedRealtime() - lastSavedAt > 5000L) {
            getSharedPreferences(STORE, MODE_PRIVATE).edit()
                .putString("rascunho_percurso", route.toString())
                .putLong("rascunho_inicio", startedWall)
                .putFloat("rascunho_metros", meters.toFloat()).apply()
            lastSavedAt = SystemClock.elapsedRealtime()
        }
        val elapsed = (SystemClock.elapsedRealtime() - startedAt) / 1000
        val pace = if (meters >= 100) (elapsed / (meters / 1000.0)).toInt() else 0
        val summary = String.format(Locale.US, "%.2f km • %d:%02d • %d:%02d/km",
            meters / 1000, elapsed / 60, elapsed % 60, pace / 60, pace % 60)
        getSharedPreferences(STORE, MODE_PRIVATE).edit()
            .putFloat("atual_metros", meters.toFloat()).putLong("atual_segundos", elapsed)
            .putInt("atual_amostras", samples).apply()
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(NOTIFICATION_ID, notification(summary))
    }
    private fun stopTracking() {
        callback?.let { fused.removeLocationUpdates(it) }
        callback = null
        if (startedAt == 0L) return
        val elapsed = (SystemClock.elapsedRealtime() - startedAt) / 1000
        val record = JSONObject().put("inicio", startedWall).put("fim", System.currentTimeMillis())
            .put("distancia_m", meters.toInt()).put("duracao_s", elapsed)
            .put("amostras", samples).put("pontos", route)
        val prefs = getSharedPreferences(STORE, MODE_PRIVATE)
        // Dados locais: não são enviados ao ranking sem autenticação e validação no servidor.
        val history = try { JSONArray(prefs.getString("historico", "[]")) } catch (_: Exception) { JSONArray() }
        history.put(record)
        prefs.edit().putBoolean("ativo", false).putString("historico", history.toString())
            .putFloat("ultimo_metros", meters.toFloat()).putLong("ultimo_segundos", elapsed)
            .putInt("amostras", samples).remove("rascunho_percurso").remove("rascunho_inicio").remove("rascunho_metros").apply()
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(NOTIFICATION_ID + 1,
            Notification.Builder(this, CHANNEL).setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentTitle("Treino salvo no celular")
                .setContentText(String.format(Locale.US, "%.2f km • %d segundos", meters / 1000, elapsed))
                .setAutoCancel(true).build())
        stopForeground(STOP_FOREGROUND_REMOVE)
    }
    override fun onDestroy() { callback?.let { fused.removeLocationUpdates(it) }; super.onDestroy() }
}
