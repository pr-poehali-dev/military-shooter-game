import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  email: string;
  nickname: string;
  password: string;
  level: number;
  weapons: string[];
  friends: string[];
  avatar?: string;
  isAdmin?: boolean;
}

type GameState = 'auth' | 'menu' | 'game' | 'profile' | 'multiplayer' | 'friends' | 'shop' | 'admin';

const ADMIN_CREDENTIALS = { login: 'plutka', password: 'user' };

const AVATARS = ['🎖️', '⚔️', '🔫', '💣', '🎯', '🚁', '🛡️', '⭐', '💀', '🔥', '⚡', '🎮'];

const LEVEL_MISSIONS = [
  { level: 1, name: 'Тренировочный полигон', enemies: 5, description: 'Освой базовые навыки стрельбы' },
  { level: 2, name: 'Застава у реки', enemies: 8, description: 'Защити позицию от наступающих' },
  { level: 3, name: 'Городские развалины', enemies: 10, description: 'Зачисти здания от противников' },
  { level: 4, name: 'Пустынный аванпост', enemies: 12, description: 'Уничтож вражеский гарнизон' },
  { level: 5, name: 'Горный перевал', enemies: 15, description: 'Прорвись через засаду в горах' },
  { level: 6, name: 'Заброшенный завод', enemies: 18, description: 'Зачисти промышленную зону' },
  { level: 7, name: 'Мост через ущелье', enemies: 20, description: 'Захвати стратегический мост' },
  { level: 8, name: 'Вражеская база', enemies: 22, description: 'Штурм укрепленной базы' },
  { level: 9, name: 'Операция "Гром"', enemies: 25, description: 'Финальная подготовка к решающей битве' },
  { level: 10, name: 'ФИНАЛЬНАЯ БИТВА', enemies: 30, description: 'Въезд на полигон под артобстрелом' }
];

export default function Index() {
  const [gameState, setGameState] = useState<GameState>('auth');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [kills, setKills] = useState(0);
  const [enemies, setEnemies] = useState<{id: number, x: number, y: number, alive: boolean}[]>([]);
  const [explosions, setExplosions] = useState<{id: number, x: number, y: number}[]>([]);
  const [chatMessages, setChatMessages] = useState<{id: number, user: string, text: string, timestamp: Date}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const user = JSON.parse(stored);
      if (!user.avatar) {
        user.avatar = AVATARS[0];
      }
      setCurrentUser(user);
      setGameState('menu');
    }
  }, []);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playSound = (type: 'shoot' | 'hit' | 'levelup' | 'explosion') => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === 'shoot') {
        oscillator.frequency.value = 200;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
      } else if (type === 'hit') {
        oscillator.frequency.value = 100;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      } else if (type === 'explosion') {
        oscillator.frequency.value = 50;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      } else if (type === 'levelup') {
        oscillator.frequency.value = 523.25;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        oscillator.start(ctx.currentTime);
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const saveUser = (user: User) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex((u: User) => u.email === user.email);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleAuth = () => {
    if (authMode === 'login') {
      if (nickname === ADMIN_CREDENTIALS.login && password === ADMIN_CREDENTIALS.password) {
        const adminUser: User = {
          email: 'admin@warzone.com',
          nickname: ADMIN_CREDENTIALS.login,
          password: ADMIN_CREDENTIALS.password,
          level: 10,
          weapons: ['AK-47', 'M4A1', 'AWP', 'Desert Eagle'],
          friends: [],
          avatar: '🎖️',
          isAdmin: true
        };
        setCurrentUser(adminUser);
        saveUser(adminUser);
        setGameState('menu');
        toast({ title: '🎖️ Доступ администратора получен' });
        return;
      }

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: User) => u.nickname === nickname && u.password === password);
      if (user) {
        if (!user.avatar) user.avatar = AVATARS[0];
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setGameState('menu');
        toast({ title: '🎮 Добро пожаловать, боец!' });
      } else {
        toast({ title: '❌ Неверные данные', variant: 'destructive' });
      }
    } else {
      if (!email || !nickname || !password) {
        toast({ title: '⚠️ Заполните все поля', variant: 'destructive' });
        return;
      }
      const newUser: User = {
        email,
        nickname,
        password,
        level: 1,
        weapons: ['Pistol'],
        friends: [],
        avatar: AVATARS[0]
      };
      setCurrentUser(newUser);
      saveUser(newUser);
      setGameState('menu');
      toast({ title: '✅ Регистрация успешна! Добро пожаловать на фронт!' });
    }
  };

  const startGame = () => {
    setGameState('game');
    setHealth(100);
    setAmmo(30);
    setKills(0);
    setCurrentLevel(currentUser?.level || 1);
    setExplosions([]);
    spawnEnemies();
  };

  const spawnEnemies = () => {
    const mission = LEVEL_MISSIONS[(currentUser?.level || 1) - 1];
    const count = mission.enemies;
    const newEnemies = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      alive: true
    }));
    setEnemies(newEnemies);
  };

  const shoot = (enemyId: number, x: number, y: number) => {
    if (ammo <= 0) {
      toast({ title: '🔫 Патроны закончились!', variant: 'destructive' });
      return;
    }

    playSound('shoot');
    setAmmo(prev => prev - 1);
    setEnemies(prev => prev.map(enemy => 
      enemy.id === enemyId ? { ...enemy, alive: false } : enemy
    ));
    setKills(prev => prev + 1);
    playSound('explosion');
    
    const explosionId = Date.now() + Math.random();
    setExplosions(prev => [...prev, { id: explosionId, x, y }]);
    setTimeout(() => {
      setExplosions(prev => prev.filter(exp => exp.id !== explosionId));
    }, 500);

    const aliveCount = enemies.filter(e => e.alive).length - 1;
    if (aliveCount === 0) {
      setTimeout(() => {
        playSound('levelup');
        const nextLevel = (currentUser?.level || 1) + 1;
        toast({ 
          title: '🏆 Уровень пройден!', 
          description: `${LEVEL_MISSIONS[(currentUser?.level || 1) - 1].name} зачищен!`
        });
        if (currentUser) {
          const updatedUser = { ...currentUser, level: Math.min(nextLevel, 10) };
          setCurrentUser(updatedUser);
          saveUser(updatedUser);
        }
        setGameState('menu');
      }, 500);
    }
  };

  const updateNickname = () => {
    if (!newNickname.trim()) return;
    if (currentUser) {
      const updatedUser = { ...currentUser, nickname: newNickname };
      setCurrentUser(updatedUser);
      saveUser(updatedUser);
      setEditingNickname(false);
      toast({ title: '✅ Позывной изменен!' });
    }
  };

  const updateAvatar = (avatar: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, avatar };
      setCurrentUser(updatedUser);
      saveUser(updatedUser);
      toast({ title: '✅ Аватар обновлен!' });
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setGameState('auth');
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const newMessage = {
      id: Date.now(),
      user: currentUser?.nickname || 'Игрок',
      text: chatInput,
      timestamp: new Date()
    };
    const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    messages.push(newMessage);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    setChatMessages(messages);
    setChatInput('');
  };

  useEffect(() => {
    if (gameState === 'multiplayer') {
      const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
      setChatMessages(messages);
      const interval = setInterval(() => {
        const updated = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        setChatMessages(updated);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  if (gameState === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
        <Card className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} border-primary/20 bg-card/90 backdrop-blur-sm animate-slide-up`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Icon name="Crosshair" size={isMobile ? 48 : 64} className="text-primary animate-pulse-glow" />
            </div>
            <CardTitle className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-black tracking-wider text-primary`}>WARZONE</CardTitle>
            <CardDescription className="text-muted-foreground">Военный тактический шутер</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className={isMobile ? 'text-xs' : ''}>ВХОД</TabsTrigger>
                <TabsTrigger value="register" className={isMobile ? 'text-xs' : ''}>РЕГИСТРАЦИЯ</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Ник</label>
                  <Input 
                    placeholder="Введите ник" 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Пароль</label>
                  <Input 
                    type="password" 
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <Button onClick={handleAuth} className={`w-full bg-primary hover:bg-primary/90 font-bold tracking-wider ${isMobile ? 'text-sm' : ''}`}>
                  <Icon name="LogIn" size={18} className="mr-2" />
                  ВОЙТИ В БОЙ
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
                  <Input 
                    type="email"
                    placeholder="soldier@warzone.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Ник</label>
                  <Input 
                    placeholder="Ваш позывной" 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Пароль</label>
                  <Input 
                    type="password" 
                    placeholder="Создайте пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <Button onClick={handleAuth} className={`w-full bg-secondary hover:bg-secondary/90 font-bold tracking-wider ${isMobile ? 'text-sm' : ''}`}>
                  <Icon name="UserPlus" size={18} className="mr-2" />
                  РЕГИСТРАЦИЯ
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'game') {
    const mission = LEVEL_MISSIONS[currentLevel - 1];
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted via-background to-muted p-2 md:p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(14, 165, 233, 0.3) 8px, rgba(14, 165, 233, 0.3) 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(14, 165, 233, 0.3) 8px, rgba(14, 165, 233, 0.3) 9px)'
        }} />

        <div className="relative z-10">
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} mb-4 bg-card/80 backdrop-blur-sm p-2 md:p-4 rounded border border-primary/30`}>
            <div className={`flex ${isMobile ? 'justify-between' : 'gap-6'}`}>
              <div className="flex items-center gap-1 md:gap-2">
                <Icon name="Heart" size={isMobile ? 16 : 20} className="text-destructive" />
                <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>{health}%</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Icon name="Zap" size={isMobile ? 16 : 20} className="text-secondary" />
                <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>{ammo}</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Icon name="Target" size={isMobile ? 16 : 20} className="text-accent" />
                <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>{kills}</span>
              </div>
            </div>
            <div className={isMobile ? 'flex justify-between items-center' : ''}>
              <Badge variant="outline" className={`${isMobile ? 'text-xs px-2 py-1' : 'text-lg px-4 py-2'} border-primary text-primary`}>
                УРОВЕНЬ {currentLevel}
              </Badge>
              {isMobile && (
                <Button onClick={() => setGameState('menu')} variant="destructive" size="sm">
                  <Icon name="X" size={16} />
                </Button>
              )}
            </div>
            {!isMobile && (
              <Button onClick={() => setGameState('menu')} variant="destructive" size="sm">
                <Icon name="X" size={18} />
              </Button>
            )}
          </div>

          <div className={`mb-2 text-center bg-card/60 backdrop-blur-sm p-2 rounded border border-primary/20`}>
            <p className={`text-primary font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>{mission.name}</p>
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>{mission.description}</p>
          </div>

          <div className={`relative ${isMobile ? 'h-[400px]' : 'h-[600px]'} bg-muted/50 rounded border-2 border-primary/40 overflow-hidden`} 
               style={{ 
                 backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 16px, rgba(14, 165, 233, 0.1) 16px, rgba(14, 165, 233, 0.1) 17px), repeating-linear-gradient(90deg, transparent, transparent 16px, rgba(14, 165, 233, 0.1) 16px, rgba(14, 165, 233, 0.1) 17px)'
               }}>
            {enemies.map(enemy => enemy.alive && (
              <div
                key={enemy.id}
                onClick={() => shoot(enemy.id, enemy.x, enemy.y)}
                className="absolute cursor-crosshair transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}
              >
                <div className="relative">
                  <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-destructive flex items-center justify-center border-2 border-destructive-foreground shadow-lg`}
                       style={{ 
                         imageRendering: 'pixelated',
                         clipPath: 'polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)'
                       }}>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'}`}>👤</div>
                  </div>
                  <div className={`absolute -top-1 -right-1 ${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-destructive animate-pulse`} 
                       style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                </div>
              </div>
            ))}

            {explosions.map(exp => (
              <div
                key={exp.id}
                className="absolute pointer-events-none animate-flash"
                style={{ left: `${exp.x}%`, top: `${exp.y}%` }}
              >
                <div className={`${isMobile ? 'text-2xl' : 'text-4xl'}`}>💥</div>
              </div>
            ))}

            {currentLevel === 10 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center bg-destructive/20 backdrop-blur-sm p-3 rounded border border-destructive">
                <p className={`text-primary font-bold ${isMobile ? 'text-base' : 'text-xl'} mb-1 animate-pulse-glow`}>
                  🚗 ФИНАЛЬНАЯ БИТВА
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Вокруг взрываются снаряды! Уничтожьте всех врагов!
                </p>
              </div>
            )}
          </div>

          <div className={`mt-2 md:mt-4 text-center text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <p>🎯 Кликай по врагам чтобы стрелять • Враги осталось: {enemies.filter(e => e.alive).length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4 md:mb-8 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Icon name="Crosshair" size={isMobile ? 32 : 48} className="text-primary animate-pulse-glow" />
            <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-black tracking-wider text-primary`}>WARZONE</h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Avatar className={isMobile ? 'w-6 h-6' : 'w-8 h-8'}>
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {currentUser?.avatar || '🎖️'}
              </AvatarFallback>
            </Avatar>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              Добро пожаловать, <span className="text-primary font-bold">{currentUser?.nickname}</span>
            </p>
          </div>
        </div>

        <div className={`grid ${isMobile ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-2 md:gap-4 mb-4 md:mb-8`}>
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={startGame}>
            <CardHeader className={isMobile ? 'p-3' : ''}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
                <Icon name="Play" size={isMobile ? 18 : 24} className="text-accent" />
                ИГРАТЬ
              </CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>Миссия уровня {currentUser?.level}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setGameState('profile')}>
            <CardHeader className={isMobile ? 'p-3' : ''}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
                <Icon name="User" size={isMobile ? 18 : 24} className="text-primary" />
                ПРОФИЛЬ
              </CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>Статистика</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setGameState('multiplayer')}>
            <CardHeader className={isMobile ? 'p-3' : ''}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
                <Icon name="Users" size={isMobile ? 18 : 24} className="text-secondary" />
                МУЛЬТИПЛЕЕР
              </CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>Поиск и чат</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setGameState('friends')}>
            <CardHeader className={isMobile ? 'p-3' : ''}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
                <Icon name="Heart" size={isMobile ? 18 : 24} className="text-destructive" />
                ДРУЗЬЯ
              </CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>Союзники ({currentUser?.friends.length || 0})</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setGameState('shop')}>
            <CardHeader className={isMobile ? 'p-3' : ''}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
                <Icon name="ShoppingCart" size={isMobile ? 18 : 24} className="text-accent" />
                МАГАЗИН
              </CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>Оружие</CardDescription>
            </CardHeader>
          </Card>

          {currentUser?.isAdmin && (
            <Card className="bg-card/80 backdrop-blur-sm border-destructive/50 hover:border-destructive transition-colors cursor-pointer" onClick={() => setGameState('admin')}>
              <CardHeader className={isMobile ? 'p-3' : ''}>
                <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
                  <Icon name="Shield" size={isMobile ? 18 : 24} className="text-destructive" />
                  АДМИНКА
                </CardTitle>
                <CardDescription className={isMobile ? 'text-xs' : ''}>Управление</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {gameState === 'profile' && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                  <Icon name="User" size={isMobile ? 20 : 24} />
                  Профиль бойца
                </span>
                <Button variant="outline" size="sm" onClick={() => setGameState('menu')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Avatar className="w-16 h-16 cursor-pointer hover:ring-2 ring-primary transition-all">
                          <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                            {currentUser?.avatar || '🎖️'}
                          </AvatarFallback>
                        </Avatar>
                      </DialogTrigger>
                      <DialogContent className={isMobile ? 'max-w-sm' : ''}>
                        <DialogHeader>
                          <DialogTitle>Выбери аватар</DialogTitle>
                          <DialogDescription>Кликни на иконку для выбора</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-4 gap-3">
                          {AVATARS.map(av => (
                            <Avatar 
                              key={av} 
                              className="w-14 h-14 cursor-pointer hover:ring-2 ring-primary transition-all"
                              onClick={() => updateAvatar(av)}
                            >
                              <AvatarFallback className="bg-muted text-3xl">{av}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Позывной</p>
                      {editingNickname ? (
                        <div className="flex gap-2">
                          <Input 
                            value={newNickname} 
                            onChange={(e) => setNewNickname(e.target.value)}
                            placeholder={currentUser?.nickname}
                            className={isMobile ? 'text-sm' : ''}
                          />
                          <Button size="sm" onClick={updateNickname}>OK</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingNickname(false)}>
                            <Icon name="X" size={16} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-primary`}>{currentUser?.nickname}</p>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setNewNickname(currentUser?.nickname || '');
                            setEditingNickname(true);
                          }}>
                            <Icon name="Edit" size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                    <p className={isMobile ? 'text-sm' : 'text-lg'}>{currentUser?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Прогресс миссий</p>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`${isMobile ? 'text-lg px-3 py-1' : 'text-2xl px-4 py-2'} border-primary text-primary`}>
                        {currentUser?.level} / 10
                      </Badge>
                      <Progress value={(currentUser?.level || 1) * 10} className="flex-1" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Арсенал</p>
                  <div className="space-y-2">
                    {currentUser?.weapons.map((weapon, idx) => (
                      <div key={idx} className={`flex items-center gap-2 bg-muted/50 p-2 rounded ${isMobile ? 'text-sm' : ''}`}>
                        <Icon name="Crosshair" size={18} className="text-secondary" />
                        <span className="font-mono">{weapon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Доступные миссии</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {LEVEL_MISSIONS.slice(0, currentUser?.level || 1).map((mission, idx) => (
                    <div key={idx} className={`bg-muted/30 p-3 rounded border ${mission.level === currentUser?.level ? 'border-primary' : 'border-border'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>{mission.name}</span>
                        <Badge variant={mission.level === currentUser?.level ? 'default' : 'outline'} className={isMobile ? 'text-xs' : ''}>
                          {mission.level === currentUser?.level ? 'ТЕКУЩАЯ' : 'ПРОЙДЕНО'}
                        </Badge>
                      </div>
                      <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>{mission.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={logout} variant="destructive" className="w-full">
                <Icon name="LogOut" size={18} className="mr-2" />
                ВЫЙТИ ИЗ СИСТЕМЫ
              </Button>
            </CardContent>
          </Card>
        )}

        {gameState === 'multiplayer' && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                  <Icon name="Users" size={isMobile ? 20 : 24} />
                  Мультиплеер
                </span>
                <Button variant="outline" size="sm" onClick={() => setGameState('menu')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>Найди противника по нику и общайся в чате</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Поиск игрока</label>
                    <Input placeholder="Введи ник противника..." className="bg-input" />
                    <Button className={`w-full mt-2 bg-secondary hover:bg-secondary/90 ${isMobile ? 'text-sm' : ''}`}>
                      <Icon name="Search" size={18} className="mr-2" />
                      НАЙТИ ПРОТИВНИКА
                    </Button>
                  </div>
                  <div className="text-center text-muted-foreground text-sm pt-4 border-t border-border">
                    <Icon name="Swords" size={isMobile ? 32 : 40} className="mx-auto mb-2 text-primary/30" />
                    <p className="text-xs">Поиск матчей в разработке</p>
                  </div>
                </div>

                <div className={`flex flex-col ${isMobile ? 'h-[350px]' : 'h-[400px]'}`}>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Общий чат</label>
                  <div className="flex-1 bg-muted/30 rounded border border-border p-3 overflow-y-auto mb-3 space-y-2">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        <Icon name="MessageSquare" size={isMobile ? 24 : 32} className="mx-auto mb-2 opacity-30" />
                        <p className={isMobile ? 'text-xs' : ''}>Чат пуст. Напиши первым!</p>
                      </div>
                    ) : (
                      chatMessages.map(msg => (
                        <div key={msg.id} className={`bg-card/50 rounded p-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-primary">{msg.user}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-foreground">{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Напиши сообщение..." 
                      className={`bg-input ${isMobile ? 'text-sm' : ''}`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} size="icon" className="shrink-0">
                      <Icon name="Send" size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState === 'friends' && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                  <Icon name="Heart" size={isMobile ? 20 : 24} />
                  Друзья
                </span>
                <Button variant="outline" size="sm" onClick={() => setGameState('menu')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Icon name="UserPlus" size={isMobile ? 40 : 48} className="mx-auto mb-2 text-primary/30" />
                <p className={isMobile ? 'text-sm' : ''}>У тебя пока нет союзников</p>
                <p className={`mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>Добавляй друзей через мультиплеер</p>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState === 'shop' && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                  <Icon name="ShoppingCart" size={isMobile ? 20 : 24} />
                  Оружейный магазин
                </span>
                <Button variant="outline" size="sm" onClick={() => setGameState('menu')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>Покупай оружие за очки опыта</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
                {['AK-47', 'M4A1', 'AWP', 'Desert Eagle', 'MP5', 'Shotgun'].map((weapon, idx) => (
                  <div key={idx} className={`bg-muted/50 p-4 rounded border border-border hover:border-primary/50 transition-colors ${isMobile ? 'p-3' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Crosshair" size={20} className="text-secondary" />
                        <span className={`font-bold font-mono ${isMobile ? 'text-sm' : ''}`}>{weapon}</span>
                      </div>
                      <Badge variant="outline" className={`border-accent text-accent ${isMobile ? 'text-xs' : ''}`}>
                        {(idx + 1) * 500} XP
                      </Badge>
                    </div>
                    <Button size="sm" className={`w-full ${isMobile ? 'text-xs' : ''}`} variant="secondary">
                      КУПИТЬ
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {gameState === 'admin' && currentUser?.isAdmin && (
          <Card className="bg-card/80 backdrop-blur-sm border-destructive/50 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                  <Icon name="Shield" size={isMobile ? 20 : 24} className="text-destructive" />
                  Админ-панель
                </span>
                <Button variant="outline" size="sm" onClick={() => setGameState('menu')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>Управление игрой и игроками</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
                <Button variant="outline" className={`justify-start h-auto ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="Users" size={20} />
                      <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>Управление игроками</span>
                    </div>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>Просмотр и редактирование</p>
                  </div>
                </Button>
                <Button variant="outline" className={`justify-start h-auto ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="Settings" size={20} />
                      <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>Настройки игры</span>
                    </div>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>Уровни, баланс, награды</p>
                  </div>
                </Button>
                <Button variant="outline" className={`justify-start h-auto ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="Database" size={20} />
                      <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>База данных</span>
                    </div>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>Резервные копии и статистика</p>
                  </div>
                </Button>
                <Button variant="outline" className={`justify-start h-auto ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="AlertCircle" size={20} />
                      <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>Логи системы</span>
                    </div>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>События и ошибки</p>
                  </div>
                </Button>
              </div>
              
              <div className={`bg-destructive/10 border border-destructive/30 rounded ${isMobile ? 'p-3' : 'p-4'} mt-6`}>
                <div className="flex items-start gap-2">
                  <Icon name="ShieldAlert" size={20} className="text-destructive mt-1" />
                  <div>
                    <p className={`font-bold text-destructive ${isMobile ? 'text-sm' : ''}`}>Режим администратора</p>
                    <p className={`text-muted-foreground mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      У вас есть полный доступ к системе. Используйте с осторожностью.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
