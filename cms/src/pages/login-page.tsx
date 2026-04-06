import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { fetchMe, loginCms } from '../services/cms-api';
import { getErrorMessage } from '../lib/utils';
import { useAuthStore } from '../store/auth-store';

export function LoginPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const setProfile = useAuthStore((state) => state.setProfile);

  const [credential, setCredential] = useState('');
  const [secret, setSecret] = useState('');

  const loginMutation = useMutation({
    mutationFn: async () => {
      const auth = await loginCms({ credential, secret });
      setToken(auth.token);
      const profile = await fetchMe();
      setProfile(profile);
      return profile;
    },
    onSuccess: () => {
      toast.success('Đăng nhập thành công');
      navigate('/', { replace: true });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <div className='relative flex min-h-screen items-center justify-center p-4'>
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute -left-20 top-16 h-80 w-80 rounded-full bg-primary/20 blur-[120px]' />
        <div className='absolute -right-12 top-24 h-80 w-80 rounded-full bg-accent/20 blur-[110px]' />
      </div>

      <Card className='w-full max-w-md border-white/80 bg-white/95 shadow-glow'>
        <CardHeader>
          <CardTitle className='text-2xl'>Đăng nhập CMS</CardTitle>
          <CardDescription>Quản trị dữ liệu Cimo School qua API bảo mật JWT.</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className='space-y-4'
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate();
            }}
          >
            <div className='space-y-1.5'>
              <Label htmlFor='credential'>Tài khoản</Label>
              <div className='relative'>
                <UserRound className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  id='credential'
                  className='pl-9'
                  value={credential}
                  placeholder='Nhập username'
                  onChange={(event) => setCredential(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='secret'>Mật khẩu</Label>
              <div className='relative'>
                <KeyRound className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  id='secret'
                  type='password'
                  className='pl-9'
                  value={secret}
                  placeholder='Nhập mật khẩu'
                  onChange={(event) => setSecret(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type='submit' className='w-full' size='lg' disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Đang xác thực...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
