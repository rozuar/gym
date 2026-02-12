package cl.boxmagic.mobile.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import cl.boxmagic.mobile.data.RetrofitClient
import cl.boxmagic.mobile.data.TokenManager
import cl.boxmagic.mobile.ui.screens.BookingsScreen
import cl.boxmagic.mobile.ui.screens.LoginScreen
import cl.boxmagic.mobile.ui.screens.ScheduleScreen
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun AppNavigation(
    navController: NavHostController = rememberNavController(),
    tokenManager: TokenManager
) {
    LaunchedEffect(Unit) {
        val token = withContext(Dispatchers.IO) { tokenManager.getAccessToken() }
        if (token != null) {
            RetrofitClient.setAccessToken(token)
            navController.navigate("schedule") { popUpTo(0) { inclusive = true } }
        }
    }

    NavHost(
        navController = navController,
        startDestination = "login"
    ) {
        composable("login") {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate("schedule") { popUpTo("login") { inclusive = true } }
                },
                tokenManager = tokenManager
            )
        }
        composable("schedule") {
            ScheduleScreen(
                onLogout = {
                    navController.navigate("login") { popUpTo("schedule") { inclusive = true } }
                },
                onBookingsClick = { navController.navigate("bookings") },
                tokenManager = tokenManager
            )
        }
        composable("bookings") {
            BookingsScreen(
                onBack = { navController.popBackStack() },
                tokenManager = tokenManager
            )
        }
    }
}
