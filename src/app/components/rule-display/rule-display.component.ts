import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Rule} from '../../models/rule';
import {ValidationResult} from '../../models/validation-result';

@Component({
  selector: 'app-rule-display',
  templateUrl: './rule-display.component.html',
  styleUrls: ['./rule-display.component.scss']
})
export class RuleDisplayComponent implements OnChanges {
  @Input() rule!: Rule;
  @Input() validationResult?: ValidationResult;
  @Input() password: string = '';

  statusClass: string = 'pending';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['validationResult'] && this.validationResult) {
      this.statusClass = this.validationResult.isValid ? 'valid' : 'invalid';
    } else {
      this.statusClass = 'pending';
    }
  }
}
