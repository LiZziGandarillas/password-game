import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Rule} from '../../models/rule';
import {ValidationResult} from '../../models/validation-result';
import {RulesService} from '../../services/rules.service';

@Component({
  selector: 'app-password-game',
  templateUrl: './password-game.component.html',
  styleUrls: ['./password-game.component.scss']
})
export class PasswordGameComponent implements OnInit, OnDestroy {
  password: string = '';
  activeRules: Rule[] = [];
  validationResults: { id: number; result: ValidationResult }[] = [];
  captchaValue: string = '';
  sacrificedLetter: string = '';
  gameCompleted: boolean = false;
  isGeneratingCaptcha: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private rulesService: RulesService) {
  }

  ngOnInit(): void {
    this.rulesService.getActiveRules()
      .pipe(takeUntil(this.destroy$))
      .subscribe(rules => {
        this.activeRules = rules;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPasswordChange(): void {
    this.validationResults = this.rulesService.validatePassword(this.password);
    this.checkGameCompletion();

    if (this.activeRules.some(rule => rule.id === 13) && !this.captchaValue) {
      this.generateCaptcha();
    }
  }

  private checkGameCompletion(): void {
    this.gameCompleted = this.activeRules.length >= 15 && this.activeRules.every(rule => rule.isCompleted);
  }

  generateCaptcha(): void {
    this.isGeneratingCaptcha = true;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let char = 0; char < 6; char++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    this.captchaValue = code;
    this.rulesService.updateGameState({captchaValue: code});
    this.isGeneratingCaptcha = false;
  }

  selectLetterToSacrifice(letter: string): void {
    if (this.sacrificedLetter) {
      this.password = this.password.replace(new RegExp(this.sacrificedLetter, 'g'), '');
    }
    this.sacrificedLetter = letter;
    this.rulesService.updateGameState({sacrificedLetter: letter});

    this.onPasswordChange();
  }

  getValidationResult(id: number): ValidationResult | undefined {
    return this.validationResults.find(result => result.id === id)?.result;
  }

  getRuleStatus(rule: Rule): string {
    const result = this.getValidationResult(rule.id);
    if (!result) return 'pending';
    return result.isValid ? 'valid' : 'invalid';
  }
}
