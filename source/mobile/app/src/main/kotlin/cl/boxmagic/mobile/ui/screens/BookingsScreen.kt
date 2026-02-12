package cl.boxmagic.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import cl.boxmagic.mobile.data.Booking
import cl.boxmagic.mobile.data.RetrofitClient
import cl.boxmagic.mobile.data.TokenManager
import kotlinx.coroutines.launch

@Composable
fun BookingsScreen(
    onBack: () -> Unit,
    tokenManager: TokenManager
) {
    var bookings by remember { mutableStateOf<List<Booking>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        try {
            val response = RetrofitClient.apiService.getMyBookings(upcoming = true)
            if (response.isSuccessful) {
                bookings = response.body()?.bookings ?: emptyList()
            }
        } catch (e: Exception) {
            error = e.message ?: "Error"
        }
        loading = false
    }

    fun refreshBookings() {
        scope.launch {
            loading = true
            try {
                val response = RetrofitClient.apiService.getMyBookings(upcoming = true)
                if (response.isSuccessful) {
                    bookings = response.body()?.bookings ?: emptyList()
                }
            } catch (e: Exception) {
                error = e.message ?: "Error"
            }
            loading = false
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Mis reservas") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Text("←", style = MaterialTheme.typography.titleLarge)
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
            bookings.isEmpty() -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text("No tienes reservas próximas")
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(bookings) { booking ->
                        BookingItem(
                            booking = booking,
                            onCancel = {
                                scope.launch {
                                    try {
                                        val resp = RetrofitClient.apiService.cancelBooking(booking.id)
                                        if (resp.isSuccessful) refreshBookings()
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
private fun BookingItem(
    booking: Booking,
    onCancel: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            val name = booking.class_name ?: booking.schedule?.class_name ?: "Reserva #${booking.id}"
            val discipline = booking.discipline_name ?: booking.schedule?.discipline_name
            val dateStr = booking.schedule_date ?: booking.schedule?.date
            val timeStr = booking.start_time ?: booking.schedule?.start_time
            Text(text = name, style = MaterialTheme.typography.titleMedium)
            discipline?.let { Text(text = it, style = MaterialTheme.typography.bodySmall) }
            if (dateStr != null && timeStr != null) {
                Text(text = "$dateStr • $timeStr", style = MaterialTheme.typography.bodySmall)
            }
            androidx.compose.material3.TextButton(onClick = onCancel) {
                Text("Cancelar reserva", color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
