import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, timer} from 'rxjs';
import {GameState} from '../models/game-state';
import {Rule} from '../models/rule';
import {RuleValidationResult} from '../models/rule-validation-result';

@Injectable({
  providedIn: 'root'
})
export class RulesService {
  private rules: Rule[] = [];
  private activeRuleSubject = new BehaviorSubject<Rule[]>([]);
  private gameState: GameState = {
    currentTime: new Date(),
    emojiPhase: false,
    sacrificePhase: false,
    moonPhase: RulesService.getCurrentMoonPhase(),
    captchaValue: '',
  };

  constructor() {
    this.initializeRules();
    this.rules[0].isActive = true;
    this.emitActiveRules();

    timer(0, 1000).subscribe(() => {
      this.gameState.currentTime = new Date();
    });
  }

  getActiveRules(): Observable<Rule[]> {
    return this.activeRuleSubject.asObservable();
  }

  validatePassword(password: string): RuleValidationResult[] {
    this.gameState.currentTime = new Date();

    this.rules.forEach(rule => {
      if (rule.isActive) {
        const validation = rule.validate(password, this.gameState);
        rule.isCompleted = validation.isValid;
      }
    });

    this.rules.forEach((rule, index) => {
      if (rule.isActive && rule.isCompleted) {
        const nextRule = this.rules[index + 1];
        if (nextRule && !nextRule.isActive) {
          nextRule.isActive = true;
          const nextValidation = nextRule.validate(password, this.gameState);
          nextRule.isCompleted = nextValidation.isValid;
        }
      }
    });

    const results: RuleValidationResult[] = this.rules
      .filter(rule => rule.isActive)
      .map(rule => {
        const validation = rule.validate(password, this.gameState);
        return {id: rule.id, result: validation};
      });

    this.emitActiveRules();
    return results;
  }

  updateGameState(partialState: Partial<GameState>): void {
    this.gameState = {...this.gameState, ...partialState};
  }

  private emitActiveRules(): void {
    const active = this.rules
      .filter(rule => rule.isActive)
      .sort((currentRule, nextRule) => currentRule.order - nextRule.order);
    this.activeRuleSubject.next(active);
  }

  private static getCurrentMoonPhase(): string {
    const phases = ['Nueva', 'Creciente', 'Cuarto Creciente', 'Gibosa Creciente',
      'Llena', 'Gibosa Menguante', 'Cuarto Menguante', 'Menguante'];
    const dayOfYear = RulesService.getDayOfYear(new Date());
    const index = Math.floor((dayOfYear % 29.5) / 3.69);
    return phases[index % 8];
  }

  private static getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private initializeRules(): void {
    this.rules = [
      {
        id: 1,
        description: 'Tu contraseña debe tener al menos 5 caracteres',
        isActive: false,
        isCompleted: false,
        order: 1,
        validate: (password: string) => {
          const isValid = password.length >= 5;
          return {
            isValid,
            message: isValid ? undefined : 'La contraseña debe tener al menos 5 caracteres'
          };
        }
      },
      {
        id: 2,
        description: 'Tu contraseña debe incluir un número',
        isActive: false,
        isCompleted: false,
        order: 2,
        validate: (password: string) => {
          const isValid = /\d/.test(password);
          return {
            isValid,
            message: isValid ? undefined : 'La contraseña debe incluir al menos un número'
          };
        }
      },
      {
        id: 3,
        description: 'Tu contraseña debe incluir una letra mayúscula',
        isActive: false,
        isCompleted: false,
        order: 3,
        validate: (password: string) => {
          const isValid = /[A-Z]/.test(password);
          return {
            isValid,
            message: isValid ? undefined : 'La contraseña debe incluir al menos una letra mayúscula'
          };
        }
      },
      {
        id: 4,
        description: 'Tu contraseña debe incluir un carácter especial',
        isActive: false,
        isCompleted: false,
        order: 4,
        validate: (password: string) => {
          const isValid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
          return {
            isValid,
            message: isValid ? undefined : 'La contraseña debe incluir al menos un carácter especial'
          };
        }
      },
      {
        id: 5,
        description: 'La suma de los números en tu contraseña debe ser 25',
        isActive: false,
        isCompleted: false,
        order: 5,
        validate: (password: string) => {
          const numbers = password.match(/\d/g);
          const sum = numbers ? numbers.reduce((acc, num) => acc + parseInt(num, 10), 0) : 0;
          const isValid = sum === 25;
          return {
            isValid,
            message: isValid ? undefined : `La suma actual es ${sum}, necesitas 25`
          };
        }
      },
      {
        id: 6,
        description: 'Tu contraseña debe incluir un mes del año',
        isActive: false,
        isCompleted: false,
        order: 6,
        validate: (password: string) => {
          const months = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          const lowerPassword = password.toLowerCase();
          const hasMonth = months.some(month => lowerPassword.includes(month));
          return {
            isValid: hasMonth,
            message: hasMonth ? undefined : 'Tu contraseña debe incluir un mes del año'
          };
        }
      },
      {
        id: 7,
        description: 'Tu contraseña debe incluir un número romano',
        isActive: false,
        isCompleted: false,
        order: 7,
        validate: (password: string) => {
          const romanRegex = /M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})/;
          const matches = password.match(new RegExp(romanRegex, 'g'));

          if (!matches) {
            return {
              isValid: false,
              message: 'Tu contraseña debe incluir un número romano'
            };
          }

          const validRomans = matches.filter(match => match.length > 0);

          return {
            isValid: validRomans.length > 0,
            message: validRomans.length > 0 ? undefined : 'Tu contraseña debe incluir un número romano'
          };
        }
      },
      {
        id: 8,
        description: 'Tu contraseña debe incluir la hora actual',
        isActive: false,
        isCompleted: false,
        order: 8,
        validate: (password: string, gameState: GameState) => {
          const now = gameState.currentTime;
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const timeString = `${hours}:${minutes}`;

          const isValid = password.includes(timeString);
          return {
            isValid,
            message: isValid ? undefined : `Tu contraseña debe incluir la hora actual: ${timeString}`
          };
        }
      },
      {
        id: 9,
        description: 'Los números romanos en tu contraseña deben multiplicar 35',
        isActive: false,
        isCompleted: false,
        order: 9,
        validate: (password: string) => {
          const romanRegex = /M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})/g;
          const matches = password.match(romanRegex)?.filter(m => m.length > 0) || [];
          const romanToInt = (roman: string): number => {
            const map: { [key: string]: number } = {I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000};
            let total = 0, prev = 0;
            for (const c of roman.split('').reverse()) {
              const val = map[c];
              if (val < prev) total -= val;
              else {
                total += val;
                prev = val;
              }
            }
            return total;
          };
          const product = matches.reduce((acc, m) => acc * romanToInt(m), 1);
          const isValid = matches.length > 0 && product === 35;
          return {
            isValid,
            message: isValid ? undefined : `El producto de los números romanos debe ser 35 (actual: ${product})`
          };
        }
      },
      {
        id: 10,
        description: 'Tu contraseña debe incluir un emoji',
        isActive: false,
        isCompleted: false,
        order: 10,
        validate: (password: string, gameState: GameState) => {
          const emojiRegex = /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E6}-\u{1F1FF}]/u;
          const hasEmoji = emojiRegex.test(password);

          if (hasEmoji) {
            gameState.emojiPhase = true;
          }

          return {
            isValid: hasEmoji,
            message: hasEmoji ? undefined : 'Tu contraseña debe incluir al menos un emoji'
          };
        }
      },
      {
        id: 11,
        description: 'Tu contraseña debe incluir un símbolo de la tabla periódica',
        isActive: false,
        isCompleted: false,
        order: 11,
        validate: (password: string) => {
          const symbols = [
            'He', 'Li', 'Be', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'Cl', 'Ar',
            'Ca', 'Sc', 'Ti', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
            'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
            'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
            'Sb', 'Te', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm',
            'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
            'Hf', 'Ta', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb',
            'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'Np',
            'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr',
            'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh',
            'Fl', 'Mc', 'Lv', 'Ts', 'Og'
          ];

          const lowerPassword = password.toLowerCase();
          const hasSymbol = symbols.some(sym => lowerPassword.includes(sym.toLowerCase()));
          return {
            isValid: hasSymbol,
            message: hasSymbol ? undefined : 'Tu contraseña debe incluir un símbolo de dos letras de la tabla periódica'
          };
        }
      },
      {
        id: 12,
        description: 'Tu contraseña debe incluir la actual fase lunar',
        isActive: false,
        isCompleted: false,
        order: 12,
        validate: (password: string, gameState: GameState) => {
          const emojiMap: Record<string, string> = {
            'Nueva': '🌑',
            'Creciente': '🌒',
            'Cuarto Creciente': '🌓',
            'Gibosa Creciente': '🌔',
            'Llena': '🌕',
            'Gibosa Menguante': '🌖',
            'Cuarto Menguante': '🌗',
            'Menguante': '🌘'
          };
          const phase = gameState.moonPhase || '';
          const emoji = emojiMap[phase] || '';
          const isValid = emoji !== '' && password.includes(emoji);

          return {
            isValid,
            message: isValid ? undefined : `Tu contraseña debe incluir el emoji de la fase lunar actual: ${phase}`
          };
        }
      },
      {
        id: 13,
        description: 'Tu contraseña debe resolver el CAPTCHA',
        isActive: false,
        isCompleted: false,
        order: 13,
        validate: (password: string, gameState: GameState) => {
          if (!gameState.captchaValue) {
            return {isValid: false, message: 'Resuelve el CAPTCHA primero'};
          }

          const isValid = password.includes(gameState.captchaValue);
          return {
            isValid,
            message: isValid ? undefined : `Tu contraseña debe incluir el valor del CAPTCHA: ${gameState.captchaValue}`
          };
        }
      },
      {
        id: 14,
        description: 'Debes sacrificar una letra del alfabeto',
        isActive: false,
        isCompleted: false,
        order: 14,
        validate: (password: string, gameState: GameState) => {
          if (!gameState.sacrificePhase) {
            gameState.sacrificePhase = true;
            return {isValid: false, message: 'Selecciona una letra para sacrificar'};
          }

          const letter = gameState.sacrificedLetter;
          if (!letter) {
            return {isValid: false, message: 'Debes seleccionar una letra para sacrificar'};
          }

          return {isValid: true};
        }
      },
      {
        id: 15,
        description: 'Tu contraseña no debe contener "PASSWORD"',
        isActive: false,
        isCompleted: false,
        order: 15,
        validate: (password: string) => {
          const isValid = !password.toUpperCase().includes('PASSWORD');
          return {
            isValid,
            message: isValid ? undefined : 'Tu contraseña no debe contener la palabra "PASSWORD"'
          };
        }
      }
    ];
  }
}
