import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {PasswordGameComponent} from './components/password-game/password-game.component';
import {RuleDisplayComponent} from './components/rule-display/rule-display.component';

@NgModule({
  declarations: [
    AppComponent,
    PasswordGameComponent,
    RuleDisplayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
