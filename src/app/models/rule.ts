import {GameState} from './game-state';
import {ValidationResult} from './validation-result';

export interface Rule {
  description: string;
  id: number;
  isActive: boolean;
  isCompleted: boolean;
  order: number;
  validate: (password: string, gameState: GameState) => ValidationResult;
}
