package cl.boxmagic.mobile.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cl.boxmagic.mobile.data.RetrofitClient
import cl.boxmagic.mobile.data.Schedule
import cl.boxmagic.mobile.data.TokenManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun ScheduleScreen(
    onLogout: () -> Unit,
    onBookingsClick: () -> Unit,
    tokenManager: TokenManager
) {
    var schedules by remember { mutableStateOf<List<Schedule>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        try {
            val from = LocalDate.now().format(DateTimeFormatter.ISO_DATE)
            val to = LocalDate.now().plusDays(14).format(DateTimeFormatter.ISO_DATE)
            val response = RetrofitClient.apiService.getSchedules(from, to)
            if (response.isSuccessful) {
                schedules = response.body()?.schedules ?: emptyList()
            } else {
                error = "No se pudieron cargar los horarios"
            }
        } catch (e: Exception) {
            error = e.message ?: "Error de conexión"
        }
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Horarios") },
            actions = {
                IconButton(onClick = onBookingsClick) {
                    Text("Mis reservas", style = MaterialTheme.typography.labelMedium)
                }
                IconButton(onClick = {
                    scope.launch {
                        withContext(Dispatchers.IO) { tokenManager.clearTokens() }
                        RetrofitClient.setAccessToken(null)
                        onLogout()
                    }
                }) {
                    Text("Salir")
                }
            }
        )

        when {
            loading -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            error != null -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(text = error!!, color = MaterialTheme.colorScheme.error)
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(schedules) { schedule ->
                        ScheduleItem(
                            schedule = schedule,
                            onBook = {
                                scope.launch {
                                    try {
                                        val resp = RetrofitClient.apiService.createBooking(schedule.id)
                                        if (resp.isSuccessful) {
                                            val from = LocalDate.now().format(DateTimeFormatter.ISO_DATE)
                                            val to = LocalDate.now().plusDays(14).format(DateTimeFormatter.ISO_DATE)
                                            val refresh = RetrofitClient.apiService.getSchedules(from, to)
                                            if (refresh.isSuccessful) {
                                                schedules = refresh.body()?.schedules ?: schedules
                                            }
                                        }
                                    } catch (_: Exception) {}
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ScheduleItem(
    schedule: Schedule,
    onBook: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onBook() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = schedule.class_name,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = schedule.discipline_name,
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${schedule.date} • ${schedule.start_time} - ${schedule.end_time}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "${schedule.booked}/${schedule.capacity} cupos",
                    style = MaterialTheme.typography.labelSmall
                )
            }
            if (schedule.booked < schedule.capacity) {
                FilledTonalButton(onClick = onBook) {
                    Text("Reservar")
                }
            } else {
                Text("Lleno", style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}
