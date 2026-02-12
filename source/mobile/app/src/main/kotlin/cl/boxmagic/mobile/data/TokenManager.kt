package cl.boxmagic.mobile.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth")

class TokenManager(private val context: Context) {
    companion object {
        private val ACCESS_TOKEN = stringPreferencesKey("access_token")
        private val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
    }

    val accessTokenFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[ACCESS_TOKEN]
    }

    suspend fun saveTokens(accessToken: String, refreshToken: String) {
        context.dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN] = accessToken
            prefs[REFRESH_TOKEN] = refreshToken
        }
    }

    suspend fun getAccessToken(): String? =
        context.dataStore.data.first()[ACCESS_TOKEN]

    suspend fun getRefreshToken(): String? =
        context.dataStore.data.first()[REFRESH_TOKEN]

    suspend fun clearTokens() {
        context.dataStore.edit { prefs ->
            prefs.remove(ACCESS_TOKEN)
            prefs.remove(REFRESH_TOKEN)
        }
    }
}
