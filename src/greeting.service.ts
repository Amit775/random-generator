import { Injectable } from '@nestjs/common';

@Injectable()
export class GreetingService {
  private greeting: string | undefined = undefined;

  public setGreeting(greeting: string): void {
    if (greeting == 'default') {
      this.greeting = undefined;
      return;
    }

    this.greeting = greeting;
  }

  public getGreeting(): string | undefined {
    return this.greeting;
  }
}
