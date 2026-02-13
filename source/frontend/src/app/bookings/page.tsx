'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Booking } from '@/types';

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [photoPrice, setPhotoPrice] = useState(0);
  const [photoUrl, setPhotoUrl] = useState('');
  const [addingPhotoId, setAddingPhotoId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    if (user) {
      loadBookings();
      api.getConfig().then((c) => setPhotoPrice(c.before_class_photo_price || 0)).catch(() => {});
    }
  }, [user, authLoading, router]);

  const loadBookings = async () => {
    try {
      const data = await api.getMyBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async (bookingId: number) => {
    if (!photoUrl.trim()) {
      alert('Ingresa la URL de la foto');
      return;
    }
    setAddingPhotoId(bookingId);
    try {
      await api.setBookingBeforePhoto(bookingId, photoUrl.trim());
      setPhotoUrl('');
      setAddingPhotoId(null);
      await loadBookings();
    } catch (err: any) {
      alert(err.message || 'Error al agregar foto');
      setAddingPhotoId(null);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!confirm('¿Cancelar esta reserva?')) return;

    setCancelling(bookingId);
    try {
      await api.cancelBooking(bookingId);
      await loadBookings();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      booked: 'bg-blue-500/20 text-blue-400',
      attended: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-zinc-500/20 text-zinc-400',
      no_show: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      booked: 'Reservado',
      attended: 'Asistió',
      cancelled: 'Cancelado',
      no_show: 'No asistió',
    };
    return (
      <span className={`text-xs px-2 py-1 rounded ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        <p className="text-zinc-400">{!user ? 'Redirigiendo...' : 'Cargando...'}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mis Reservas</h1>

      {bookings.length === 0 ? (
        <Card>
          <p className="text-zinc-400 text-center">No tienes reservas</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const date = new Date(booking.schedule_date + 'T12:00:00');
            const formatted = date.toLocaleDateString('es-CL', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
            const isUpcoming = date >= new Date(new Date().toDateString());
            const showPhotoOption = booking.status === 'booked' && isUpcoming && !booking.before_photo_url;

            return (
              <Card key={booking.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex gap-3 min-w-0">
                  {booking.before_photo_url && (
                    <img src={booking.before_photo_url} alt="Antes" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{booking.class_name}</h3>
                      {getStatusBadge(booking.status)}
                      {booking.before_photo_url && <span className="text-xs text-amber-400" title="Foto antes de clase">📷</span>}
                    </div>
                    <p className="text-sm text-zinc-400">
                      {booking.discipline_name} • {formatted} • {booking.start_time}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {showPhotoOption && (
                    <div className="flex gap-2 items-center flex-wrap">
                      <input
                        type="url"
                        placeholder="Pega URL de la foto (sube a imgbb.com u otro)"
                        value={addingPhotoId === booking.id ? photoUrl : ''}
                        onChange={(e) => { setAddingPhotoId(booking.id); setPhotoUrl(e.target.value); }}
                        onFocus={() => setAddingPhotoId(booking.id)}
                        className="px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded text-sm min-w-[180px]"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={addingPhotoId === booking.id}
                        onClick={() => handleAddPhoto(booking.id)}
                        disabled={!photoUrl.trim()}
                      >
                        Agregar foto {photoPrice > 0 ? `(+$${photoPrice.toLocaleString('es-CL')})` : ''}
                      </Button>
                    </div>
                  )}
                  {booking.status === 'booked' && (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={cancelling === booking.id}
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
