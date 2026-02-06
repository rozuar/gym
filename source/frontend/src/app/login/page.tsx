'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const TEST_PROFILES = [
  { label: 'Admin', email: 'admin@boxmagic.cl', password: 'admin123' },
  { label: 'Usuario', email: 'user@boxmagic.cl', password: 'user123' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const fillProfile = (profile: typeof TEST_PROFILES[0]) => {
    setEmail(profile.email);
    setPassword(profile.password);
    setError('');
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            Ingresar
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-700">
          <p className="text-sm text-zinc-500 text-center mb-3">Acceso rápido (dev)</p>
          <div className="flex gap-2">
            {TEST_PROFILES.map((profile) => (
              <button
                key={profile.email}
                type="button"
                onClick={() => fillProfile(profile)}
                className="flex-1 px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-600 transition-colors"
              >
                {profile.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-zinc-400">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-blue-500 hover:underline">
            Regístrate
          </Link>
        </p>
      </Card>
    </div>
  );
}
