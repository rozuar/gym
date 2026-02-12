package cl.boxmagic.mobile.data

import retrofit2.Response
import retrofit2.http.*

data class AuthResponse(
    val access_token: String,
    val refresh_token: String,
    val user: User
)

data class User(
    val id: Long,
    val email: String,
    val name: String,
    val phone: String? = null,
    val role: String
)

data class Schedule(
    val id: Long,
    val class_id: Long,
    val date: String,
    val capacity: Int,
    val booked: Int,
    val class_name: String,
    val discipline_name: String,
    val start_time: String,
    val end_time: String
)

data class Booking(
    val id: Long,
    val class_schedule_id: Long,
    val status: String,
    val class_name: String? = null,
    val discipline_name: String? = null,
    val schedule_date: String? = null,
    val start_time: String? = null,
    val schedule: Schedule? = null
)

data class SchedulesResponse(val schedules: List<Schedule>, val from: String, val to: String)
data class BookingsResponse(val bookings: List<Booking>)

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body body: Map<String, String>): Response<AuthResponse>

    @POST("auth/register")
    suspend fun register(@Body body: Map<String, Any>): Response<AuthResponse>

    @POST("auth/refresh")
    suspend fun refresh(@Body body: Map<String, String>): Response<AuthResponse>

    @GET("schedules")
    suspend fun getSchedules(
        @Query("from") from: String? = null,
        @Query("to") to: String? = null
    ): Response<SchedulesResponse>

    @POST("schedules/{scheduleId}/book")
    suspend fun createBooking(@Path("scheduleId") scheduleId: Long): Response<Booking>

    @DELETE("bookings/{id}")
    suspend fun cancelBooking(@Path("id") bookingId: Long): Response<Unit>

    @GET("bookings/me")
    suspend fun getMyBookings(@Query("upcoming") upcoming: Boolean = true): Response<BookingsResponse>
}
