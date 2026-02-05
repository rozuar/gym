'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Booking } from '@/types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

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

            return (
              <Card key={booking.id} className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{booking.class_name}</h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  <p className="text-sm text-zinc-400">
                    {booking.discipline_name} • {formatted} • {booking.start_time}
                  </p>
                </div>
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
