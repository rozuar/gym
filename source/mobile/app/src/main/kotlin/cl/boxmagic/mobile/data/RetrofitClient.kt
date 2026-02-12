package cl.boxmagic.mobile.data

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private const val BASE_URL = "https://gym-api-production-42fa.up.railway.app/api/v1/"

    private var accessToken: String? = null

    fun setAccessToken(token: String?) {
        accessToken = token
    }

    private val authInterceptor = Interceptor { chain ->
        val request = chain.request().newBuilder()
        accessToken?.let { token ->
            request.addHeader("Authorization", "Bearer $token")
        }
        request.addHeader("Content-Type", "application/json")
        chain.proceed(request.build())
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val apiService: ApiService = retrofit.create(ApiService::class.java)
}
