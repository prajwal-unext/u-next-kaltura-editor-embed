import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { SafePipeModule } from './safe.pipe.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SafePipeModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
