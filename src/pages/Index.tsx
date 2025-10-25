import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  email: string;
  nickname: string;
  password: string;
  level: number;
  weapons: string[];
  friends: string[];
  isAdmin?: boolean;
}

type GameState = 'auth' | 'menu' | 'game' | 'profile' | 'multiplayer' | 'friends' | 'shop' | 'admin';

const ADMIN_CREDENTIALS = { login: 'plutka', password: 'user' };

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
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
      setGameState('menu');
    }
  }, []);

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
        friends: []
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
    spawnEnemies();
  };

  const spawnEnemies = () => {
    const count = Math.min(5 + (currentLevel * 2), 25);
    const newEnemies = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      alive: true
    }));
    setEnemies(newEnemies);
  };

  const shoot = (enemyId: number) => {
    if (ammo <= 0) {
      toast({ title: '🔫 Патроны закончились!', variant: 'destructive' });
      return;
    }

    setAmmo(prev => prev - 1);
    setEnemies(prev => prev.map(enemy => 
      enemy.id === enemyId ? { ...enemy, alive: false } : enemy
    ));
    setKills(prev => prev + 1);

    const aliveCount = enemies.filter(e => e.alive).length - 1;
    if (aliveCount === 0) {
      setTimeout(() => {
        toast({ title: '🏆 Уровень пройден!', description: `Убито врагов: ${kills + 1}` });
        if (currentUser) {
          const updatedUser = { ...currentUser, level: Math.max(currentUser.level, currentLevel + 1) };
          setCurrentUser(updatedUser);
          saveUser(updatedUser);
        }
        setGameState('menu');
      }, 500);
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setGameState('auth');
  };

  if (gameState === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card/90 backdrop-blur-sm animate-slide-up">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Icon name="Crosshair" size={64} className="text-primary animate-pulse-glow" />
            </div>
            <CardTitle className="text-4xl font-black tracking-wider text-primary">WARZONE</CardTitle>
            <CardDescription className="text-muted-foreground">Военный тактический шутер</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">ВХОД</TabsTrigger>
                <TabsTrigger value="register">РЕГИСТРАЦИЯ</TabsTrigger>
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
                <Button onClick={handleAuth} className="w-full bg-primary hover:bg-primary/90 font-bold tracking-wider">
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
                <Button onClick={handleAuth} className="w-full bg-secondary hover:bg-secondary/90 font-bold tracking-wider">
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted via-background to-muted p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-20 grid-rows-20 h-full w-full">
            {Array.from({ length: 400 }).map((_, i) => (
              <div key={i} className="border border-primary/20" />
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4 bg-card/80 backdrop-blur-sm p-4 rounded border border-primary/30">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Icon name="Heart" size={20} className="text-destructive" />
                <span className="font-bold">{health}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Zap" size={20} className="text-secondary" />
                <span className="font-bold">{ammo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Target" size={20} className="text-accent" />
                <span className="font-bold">{kills}</span>
              </div>
            </div>
            <div>
              <Badge variant="outline" className="text-lg px-4 py-2 border-primary text-primary">
                УРОВЕНЬ {currentLevel}
              </Badge>
            </div>
            <Button onClick={() => setGameState('menu')} variant="destructive" size="sm">
              <Icon name="X" size={18} />
            </Button>
          </div>

          <div className="relative h-[600px] bg-muted/50 rounded border-2 border-primary/40 overflow-hidden" 
               style={{ 
                 backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(14, 165, 233, 0.05) 20px, rgba(14, 165, 233, 0.05) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(14, 165, 233, 0.05) 20px, rgba(14, 165, 233, 0.05) 21px)'
               }}>
            {enemies.map(enemy => enemy.alive && (
              <div
                key={enemy.id}
                onClick={() => shoot(enemy.id)}
                className="absolute cursor-crosshair transition-all duration-200 hover:scale-110"
                style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-destructive rounded-sm flex items-center justify-center border-2 border-destructive-foreground shadow-lg animate-pulse-glow">
                    <Icon name="Users" size={24} className="text-destructive-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-destructive rounded-full animate-pulse" />
                </div>
              </div>
            ))}

            {currentLevel === 10 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                <p className="text-primary font-bold text-xl mb-2 animate-pulse-glow">
                  🚗 ФИНАЛЬНАЯ БИТВА
                </p>
                <p className="text-sm text-muted-foreground">
                  Вокруг взрываются снаряды! Уничтожьте всех врагов!
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 text-center text-muted-foreground text-sm">
            <p>🎯 Кликай по врагам чтобы стрелять • Враги осталось: {enemies.filter(e => e.alive).length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Icon name="Crosshair" size={48} className="text-primary animate-pulse-glow" />
            <h1 className="text-5xl font-black tracking-wider text-primary">WARZONE</h1>
          </div>
          <p className="text-muted-foreground">Добро пожаловать, <span className="text-primary font-bold">{currentUser?.nickname}</span></p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={startGame}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Play" size={24} className="text-accent" />
                ИГРАТЬ
              </CardTitle>
              <CardDescription>Начать миссию уровня {currentUser?.level}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setGameState('profile')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="User" size={24} className="text-primary" />
                ПРОФИЛЬ
              </CardTitle>
              <CardDescription>Твоя статистика и достижения</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setGameState('multiplayer')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" size={24} className="text-secondary" />
                МУЛЬТИПЛЕЕР
              </CardTitle>
              <CardDescription>Поиск противников по нику</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setGameState('friends')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Heart" size={24} className="text-destructive" />
                ДРУЗЬЯ
              </CardTitle>
              <CardDescription>Список союзников ({currentUser?.friends.length || 0})</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setGameState('shop')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="ShoppingCart" size={24} className="text-accent" />
                МАГАЗИН
              </CardTitle>
              <CardDescription>Оружие и снаряжение</CardDescription>
            </CardHeader>
          </Card>

          {currentUser?.isAdmin && (
            <Card className="bg-card/80 backdrop-blur-sm border-destructive/50 hover:border-destructive transition-colors cursor-pointer" onClick={() => setGameState('admin')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Shield" size={24} className="text-destructive" />
                  АДМИН-ПАНЕЛЬ
                </CardTitle>
                <CardDescription>Управление системой</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {gameState === 'profile' && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon name="User" size={24} />
                  Профиль бойца
                </span>
                <Button variant="outline" size="sm" onClick={() => setGameState('menu')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Позывной</p>
                    <p className="text-2xl font-bold text-primary">{currentUser?.nickname}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                    <p className="text-lg">{currentUser?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Текущий уровень</p>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-2xl px-4 py-2 border-primary text-primary">
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
                      <div key={idx} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                        <Icon name="Crosshair" size={18} className="text-secondary" />
                        <span className="font-mono">{weapon}</span>
                      </div>
                    ))}
                  </div>
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
                <span className="flex items-center gap-2">
                  <Icon name="Users" size={24} />
                  Мультиплеер
                </span>
                <Button variant="outline" size="sm" onClick={() => setGameState('menu')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </CardTitle>
              <CardDescription>Найди противника по нику и вызови на дуэль</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input placeholder="Введи ник противника..." className="bg-input" />
                <Button className="w-full bg-secondary hover:bg-secondary/90">
                  <Icon name="Search" size={18} className="mr-2" />
                  НАЙТИ ПРОТИВНИКА
                </Button>
                <div className="text-center text-muted-foreground text-sm mt-8">
                  <Icon name="Swords" size={48} className="mx-auto mb-2 text-primary/30" />
                  <p>Система мультиплеера в разработке</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState === 'friends' && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon name="Heart" size={24} />
                  Друзья
                </span>
                <Button variant="outline" size="sm" onClick={() => setGameState('menu')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Icon name="UserPlus" size={48} className="mx-auto mb-2 text-primary/30" />
                <p>У тебя пока нет союзников</p>
                <p className="text-sm mt-2">Добавляй друзей через мультиплеер</p>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState === 'shop' && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon name="ShoppingCart" size={24} />
                  Оружейный магазин
                </span>
                <Button variant="outline" size="sm" onClick={() => setGameState('menu')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </CardTitle>
              <CardDescription>Покупай оружие за очки опыта</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {['AK-47', 'M4A1', 'AWP', 'Desert Eagle', 'MP5', 'Shotgun'].map((weapon, idx) => (
                  <div key={idx} className="bg-muted/50 p-4 rounded border border-border hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Crosshair" size={20} className="text-secondary" />
                        <span className="font-bold font-mono">{weapon}</span>
                      </div>
                      <Badge variant="outline" className="border-accent text-accent">
                        {(idx + 1) * 500} XP
                      </Badge>
                    </div>
                    <Button size="sm" className="w-full" variant="secondary">
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
                <span className="flex items-center gap-2">
                  <Icon name="Shield" size={24} className="text-destructive" />
                  Админ-панель
                </span>
                <Button variant="outline" size="sm" onClick={() => setGameState('menu')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </CardTitle>
              <CardDescription>Управление игрой и игроками</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="Users" size={20} />
                      <span className="font-bold">Управление игроками</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Просмотр и редактирование</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="Settings" size={20} />
                      <span className="font-bold">Настройки игры</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Уровни, баланс, награды</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="Database" size={20} />
                      <span className="font-bold">База данных</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Резервные копии и статистика</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="AlertCircle" size={20} />
                      <span className="font-bold">Логи системы</span>
                    </div>
                    <p className="text-xs text-muted-foreground">События и ошибки</p>
                  </div>
                </Button>
              </div>
              
              <div className="bg-destructive/10 border border-destructive/30 rounded p-4 mt-6">
                <div className="flex items-start gap-2">
                  <Icon name="ShieldAlert" size={20} className="text-destructive mt-1" />
                  <div>
                    <p className="font-bold text-destructive">Режим администратора</p>
                    <p className="text-sm text-muted-foreground mt-1">
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
