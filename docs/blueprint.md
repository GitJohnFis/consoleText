# **App Name**: console.text

## Core Features:

- Enhanced Console Logging: Overrides the standard `console` object to include a `.text` function for logging errors, forwarding them through the Datadog/PagerDuty integration.
- Datadog Integration: Integrates with Datadog for error tracking and monitoring.
- PagerDuty Alerting: Connects with PagerDuty to trigger SMS or call alerts based on error thresholds defined from datadog
- Dashboard Monitoring: Dashboard UI displays delivered text and also text requests blocked by rate limiting with error counts.
- Recipient Management: Provides an interface to manage recipients for alerts (text and calls) including retry mechanisms if calls aren't answered.

## Style Guidelines:

- Primary color: Dark Blue (#1A237E) for professional appearance.
- Secondary color: Light Gray (#EEEEEE) for backgrounds.
- Accent: Teal (#00BCD4) for interactive elements and important notifications.
- Clean and modern typography for readability.
- Use consistent and easily recognizable icons throughout the application.
- Clear and intuitive layout for easy navigation and monitoring.