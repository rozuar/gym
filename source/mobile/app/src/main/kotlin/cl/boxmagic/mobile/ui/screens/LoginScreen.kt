package cl.boxmagic.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import cl.boxmagic.mobile.data.RetrofitClient
import cl.boxmagic.mobile.data.TokenManager
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    tokenManager: TokenManager
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf<String?>(null) }
    var loading by rememberSaveable { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Box Magic",
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Inicia sesión en tu box",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(32.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; error = null },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; error = null },
                    label = { Text("Contraseña") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                )
                error?.let { msg ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = msg, color = MaterialTheme.colorScheme.error)
                }
                Spacer(modifier = Modifier.height(24.dp))
                Button(
                    onClick = {
                        if (email.isBlank() || password.isBlank()) {
                            error = "Completa email y contraseña"
                            return@Button
                        }
                        loading = true
                        error = null
                        scope.launch {
                            try {
                                val response = RetrofitClient.apiService.login(
                                    mapOf("email" to email, "password" to password)
                                )
                                if (response.isSuccessful) {
                                    val body = response.body()!!
                                    RetrofitClient.setAccessToken(body.access_token)
                                    tokenManager.saveTokens(body.access_token, body.refresh_token)
                                    onLoginSuccess()
                                } else {
                                    error = "Credenciales inválidas"
                                }
                            } catch (e: Exception) {
                                error = e.message ?: "Error de conexión"
                            }
                            loading = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !loading
                ) {
                    Text(if (loading) "Ingresando..." else "Ingresar")
                }
            }
        }
    }
}
