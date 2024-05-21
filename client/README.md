# Tourney

## Overview:

Version: 1.0

[abstract here]

## Table of Contents

1. [Introduction](#introduction)
- Project Purpose: Describe why the project exists and what problem it solves.
- Scope: Define the boundaries of the project, what it will and  will not do.
- Audience: Identify who the intended users and readers of the documentation are.

2. [Requirements](#requirements)
- [User stories](#user-stories)
- Functional Requirements: Detailed description of functionalities the software must provide.
- Non-functional Requirements: Performance, security, usability, and other quality attributes.
- System Requirements: Hardware and software requirements for running the software.

3. [Architecture and Design](#architecture-and-design)
- System Architecture: High-level description of the system's architecture, including diagrams (e.g., UML diagrams).
- Design Decisions: Explain major design choices and trade-offs.
- Component Descriptions: Detailed information on each major component or module.
   
4. [Implementation](#implementation)
- Code Structure: Overview of the codebase, including directory structure and naming conventions.
- Development Environment: Instructions for setting up the development environment.
- Dependencies: List and describe external libraries and frameworks used.

5. [Usage](#usage)
- Installation Guide: Step-by-step instructions on how to install the software.
- Configuration: Information on configuring the software, including configuration files and environment variables.
- User Guide: Detailed instructions on how to use the software, with examples and screenshots.

6. [Testing](#testing)
- Testing Strategy: Overview of the testing approach and types of tests used (unit tests, integration tests, etc.).
- Test Cases: Detailed test cases and expected outcomes.
- Running Tests: Instructions on how to run the tests and interpret the results.

7. [Maintenance](#maintenance)
- Troubleshooting: Common issues and their solutions.
- Updating: How to update the software, including migration steps if necessary.
- Backup and Recovery: Procedures for backing up data and recovering from failures.

8. [Contributing](#contributing)
- Contribution Guidelines: Rules and guidelines for contributing to the project.
- Code of Conduct: Behavioral guidelines for contributors.
- Development Workflow: Explanation of the development process, including branching strategy, code reviews, and continuous integration.

9.  [Appendices](#appendices)
- Glossary: Definitions of terms and acronyms used in the documentation.
- References: Links to external resources, documentation, and tools used in the project.
- License: Information about the software's license and any third-party licenses.

## Introduction

Tourney is a web application that allows users to create and manage tournaments for various games and sports. The application provides features for creating tournaments, managing participants, scheduling matches, and tracking results. Users can create public or private tournaments. Tourney is designed to be flexible and customizable to support a wide range of games and sports, from casual events to professional competitions.

## Requirements

### User Stories

#### Creating a Tournament

As a host, I want to create a tournament with custom settings, so that I can manage competitions according to my preferences.

*Acceptance Criteria:*

- The host can choose between battle royale or bracket style.
- The host can set team size (solo or team).
- The host can create and customize an application form.
- The host can set tournament title, description, start date, and end date.

#### Joining a Team-based Tournament

As a player, I want to join a team-based tournament, so that I can participate in team competitions.

*Acceptance Criteria:*

- Players can create a team in the teams interface.
- Team leaders can share invite links for others to join the team.
- The team leader can apply to tournaments on behalf of the team by filling out the application form.

#### Managing Tournament Applications

As a host, I want to review and manage tournament applications, so that I can control who participates in my tournament.

*Acceptance Criteria:*

- Applications are displayed on the manage tournament page.
- The host can accept or reject applications.

#### Handling Entry Fees and Winnings

As a host, I want to charge entry fees and distribute winnings, so that I can manage the financial aspects of the tournament.

*Acceptance Criteria:*

- Hosts can set entry fees for tournaments.
- Users can pay entry fees with credits.
- Hosts can define earnings distribution for battle royale tournaments by position.
- In bracket tournaments, the final winner receives the prize set by the host.
- Earnings are given out as credits.
- Users can withdraw their credits as money.
- For team-based tournaments, winnings are divided equally among team members.

#### Using Credits

As a user, I want to buy credits with real money and use them to pay entry fees, so that I can participate in tournaments.

*Acceptance Criteria:*

- Users can purchase credits using real money.
- Credits can be used to pay for tournament entry fees.
- Users can withdraw their credits as money.

#### Changing Tournament Details Before Start

As a host, I want to modify certain details of the tournament before it starts, so that I can ensure everything is set up correctly.

*Acceptance Criteria:*

- The host can change the tournament title, description, start date, end date, and application form before the tournament starts.
- The host can update rules and entry fees before the tournament starts.

#### Changing Tournament Details After Start

As a host, I want to modify specific details of the tournament after it starts, so that I can accommodate any necessary adjustments.

*Acceptance Criteria:*

- The host can post updates and change the tournament description after the tournament starts.
- The host cannot change the start date, end date, or entry fees after the tournament starts.
- The host can update scores and elimination statuses during the tournament.

#### Applying to Multiple Tournaments

As a team leader, I want to apply my team to multiple tournaments, so that we can participate in various competitions.

*Acceptance Criteria:*

- A team can apply to multiple tournaments.

  
#### Managing Team Applications

As a team leader, I want to manage my team's applications to different tournaments, so that I can ensure we participate in the best tournaments.

*Acceptance Criteria:*

- The team leader can view all pending and accepted tournament applications.
- The team leader can withdraw an application before the tournament starts.
- The team leader can reapply to a tournament if the application is rejected.

#### Team Invitation Management

As a team leader, I want to manage team invitations

*Acceptance Criteria:*

- The team leader can generate and share invite links.
- The team leader can accept or reject join requests.
- The team leader can remove team members before applying to tournaments.

#### Error Handling for Payments

As a user, I want to handle errors during credit purchases, so that I can resolve issues and continue to participate in tournaments.

*Acceptance Criteria:*

- If a payment fails, an error message is displayed with potential solutions.
- Users can retry the payment or contact support.
- Failed payments do not deduct credits or entry fees.

#### Handling Withdrawals

As a user, I want to withdraw my credits as money, so that I can use my winnings.

*Acceptance Criteria:*

- Users can request withdrawals from their account.
- Withdrawals are processed within a specified timeframe.
- Users receive notifications when withdrawals are processed.
- If a withdrawal fails, the credits are returned to the user's account with an error message.

#### Host Notifications

As a host, I want to receive notifications about important events, so that I can manage my tournament effectively.

*Acceptance Criteria:*

- Hosts receive notifications when new applications are submitted.
- Hosts receive notifications when users or teams have joined the tournament.

#### User Notifications

As a user, I want to receive notifications about my applications and tournament statuses, so that I stay informed about my participation.

*Acceptance Criteria:*

- Users receive notifications when their application is accepted or rejected.
- Users receive notifications about tournament start times and updates.
- Users receive notifications about tournament updates.
- Users can custommize notification preferences.

#### Tournament Search and Filters

As a user, I want to search and filter tournaments, so that I can find suitable tournaments to join.

*Acceptance Criteria:*

- Users can search tournaments by name, type (battle royale or bracket), and team size.
- Users can filter tournaments by start date, end date, entry fee, and prize amount.
- Users can save search filters for quick access in the future.

#### Viewing Tournament Details

As a user, I want to view detailed information about tournaments, so that I can make informed decisions about joining.

*Acceptance Criteria:*

- Users can view tournament title, description, start date, end date, entry fee, and prize distribution.
- Users can view application form details before applying.
- Users can see the list of accepted participants or teams.

#### Reporting Issues

As a user, I want to report issues with the tournament or platform, so that I can get help and resolve problems.

*Acceptance Criteria:*

- Users can submit issue reports through the platform.
- Users receive confirmation of their report submission.
- Users receive updates on the status of their reported issue.

#### Tournament Analytics

As a host, I want to view analytics for my tournament, so that I can understand participation and performance metrics.

*Acceptance Criteria:*

- Hosts can view the number of applications, accepted participants, and rejections.
- Hosts can see metrics on game performance, such as average scores and elimination statistics.
- Hosts can export analytics data for further analysis.

#### Integrating Live Streaming

As a host, I want to integrate live streaming into my tournament page, so that spectators can watch the tournament in real-time.

*Acceptance Criteria:*

- Hosts can link live streaming platforms to their tournament page.
- Live streams are displayed on the tournament page during the event.
- Users can interact with the live stream through chat or comments.

#### Reviewing Tournament History

As a user, I want to review past tournaments I participated in, so that I can see my performance and achievements.

*Acceptance Criteria:*

- Users can view a history of tournaments they have participated in.
- Users can see detailed results and scores for each tournament.
- Users can download certificates or badges for their achievements.

#### Customizing User Profiles

As a user, I want to customize my profile, so that I can personalize my experience on the platform.

*Acceptance Criteria:*

- Users can update their profile picture, bio, and social media links.
- Users can set privacy settings for their profile.
- Users can view their credits balance and transaction history.

#### Multi-language Support

As a user, I want to use the platform in my preferred language, so that I can navigate and understand the platform easily.

*Acceptance Criteria:*

- Users can select their preferred language from a list of available languages.
- The platform’s interface, including all text and messages, is displayed in the selected language.
- Hosts can create tournament details and application forms in multiple languages.

#### Guest Mode for Spectators

As a visitor, I want to browse tournaments and watch live streams without creating an account, so that I can enjoy the content as a guest.

*Acceptance Criteria:*

- Visitors can view public tournament details and live streams.
- Visitors are prompted to create an account only when attempting to participate or apply to a tournament.
- Guest mode includes limited interactivity, such as commenting on live streams.

#### Automated Notifications

As a user, I want to receive automated notifications about important events, so that I stay informed without manual checks.

*Acceptance Criteria:*

- Users receive email and in-app notifications about upcoming tournament deadlines.
- Users receive notifications about status changes in their applications.
- Users can customize notification preferences in their account settings.

#### Tournament Promotion

As a host, I want to promote my tournament on the platform, so that I can attract more participants.

*Acceptance Criteria:*

- Hosts can create promotional banners for their tournaments.
- Hosts can feature their tournaments on the homepage or in relevant categories.
- Hosts can share tournament links on social media directly from the platform.

#### Advanced Search and Filtering

As a user, I want to use advanced search and filtering options, so that I can find the most relevant tournaments quickly.

*Acceptance Criteria:*

- Users can filter tournaments by location, game type, and skill level.
- Users can sort tournaments by entry fee, prize amount, and start date.
- Users can save their search preferences for future use.

#### Customizable Tournament Rules

As a host, I want to set and enforce custom rules for my tournament, so that I can ensure fair play and compliance.

*Acceptance Criteria:*

- Hosts can create detailed rule sets for their tournaments.
- Participants must agree to the rules before applying.
- Hosts can disqualify participants who violate the rules.

#### Team Communication Tools

As a team leader, I want to have communication tools for my team, so that we can coordinate effectively.

*Acceptance Criteria:*

- Teams have access to a private chat room within the platform.
- Team leaders can schedule practice sessions and team meetings.
- Team members receive notifications for scheduled events.

#### Feedback and Ratings

As a participant, I want to provide feedback and rate tournaments, so that I can help improve future events.

*Acceptance Criteria:*

- Participants can rate tournaments on a scale of 1 to 5 stars.
- Participants can leave written feedback about their experience.
- Hosts can view and respond to feedback.

#### Conflict Resolution Mechanism

As a user, I want to have a mechanism for resolving conflicts, so that disputes can be handled fairly and efficiently.

*Acceptance Criteria:*

- Users can report issues or disputes through a dedicated form.
- A conflict resolution team reviews and resolves reported issues.
- Users receive updates on the status of their reports.

#### Integration with External Platforms

As a host, I want to integrate my tournament with external platforms, so that I can expand its reach and functionality.

*Acceptance Criteria:*

- Hosts can link their tournaments to external streaming services like Twitch and YouTube.
- Hosts can integrate with social media platforms for easy sharing.
- Hosts can use APIs to sync tournament data with other services.

#### Custom Branding for Tournaments

As a host, I want to apply custom branding to my tournament, so that I can create a unique and professional experience.

*Acceptance Criteria:*

- Hosts can upload logos, banners, and customize color schemes.
- Hosts can create custom URL paths for their tournaments.
- The tournament page reflects the host's branding choices.

#### API for Third-party Integrations

As a developer, I want to access the platform's API, so that I can integrate it with third-party applications.

*Acceptance Criteria:*

- The platform provides a well-documented API.
- Developers can access endpoints for tournament data, user management, and transactions.
- API keys are managed securely with access controls.

#### Multi-Tier Tournaments

As a host, I want to organize multi-tier tournaments, so that I can create complex competitive events.

*Acceptance Criteria:*

- Hosts can set up initial rounds leading to finals.
- Participants advance based on performance in earlier rounds.
- The platform manages scheduling and participant progression automatically.

#### Social Features and Friend Lists

As a user, I want to add friends and interact socially on the platform, so that I can enhance my community experience.

*Acceptance Criteria:*

- Users can send and accept friend requests.
- Users can view friends' tournament participation and achievements.
- Users can chat with friends directly within the platform.

#### Privacy and Data Security

As a user, I want to control my privacy settings, so that I can protect my personal information.

*Acceptance Criteria:*

- Users can adjust privacy settings for their profiles.
- Users can choose who can view their profile and activity.
- The platform ensures data security with encryption and secure authentication.

#### Multiple Payment Methods

As a user, I want to have multiple payment options for purchasing credits, so that I can use the most convenient method.

*Acceptance Criteria:*

- Users can purchase credits using credit/debit cards, PayPal, and other popular payment methods.
- Users receive confirmation of successful transactions.
- Users can save their preferred payment method for future transactions.

#### Cross-platform Play

As a participant, I want to join tournaments with cross-platform play, so that I can compete with players on different devices.

*Acceptance Criteria:*

- The platform supports cross-platform play for compatible games.
- Participants can see which platforms are allowed in each tournament.
- Matchmaking takes platform compatibility into account.

#### Participant Progress Tracking

As a participant, I want to track my progress and performance throughout the tournament, so that I can monitor my standing and improve my strategy.

*Acceptance Criteria:*

- Participants can view their match history, scores, and rankings.
- Progress tracking includes milestones and achievements.
- Participants receive notifications for important milestones.

#### Tournament Archiving

As a host, I want to archive completed tournaments, so that I can keep the platform organized and accessible.

*Acceptance Criteria:*

- Hosts can move completed tournaments to an archive section.
- Archived tournaments remain accessible for viewing and analysis.
- Participants can access archived tournaments to review their performance.

#### Advanced Reporting Tools

As a host, I want to use advanced reporting tools, so that I can generate detailed reports on tournament outcomes.

*Acceptance Criteria:*

- Hosts can generate reports on participant statistics, match results, and financials.
- Reports can be customized with filters and sorting options.
- Hosts can export reports in various formats (e.g., PDF, CSV).

#### Custom Widgets for Tournament Pages

As a host, I want to add custom widgets to my tournament page, so that I can enhance the user experience with additional information.

*Acceptance Criteria:*

- Hosts can choose from a library of widgets (e.g., countdown timers, social media feeds).
- Hosts can customize the appearance and content of each widget.
- Widgets can be rearranged and resized on the tournament page.

#### Tournament News and Updates

As a user, I want to stay updated with the latest news and announcements about tournaments, so that I can keep informed about upcoming events and changes.

*Acceptance Criteria:*

- Users can subscribe to tournament news and updates.
- Hosts can post announcements and news articles on the tournament page.
- Users receive notifications for important updates.

#### Pre-tournament Practice Sessions

As a participant, I want to join pre-tournament practice sessions, so that I can prepare and refine my skills.

*Acceptance Criteria:*

- Hosts can schedule practice sessions before the tournament starts.
- Participants can join practice sessions to play with other participants.
- Practice sessions include feedback and performance analytics.

#### Customizable Participant Avatars

As a user, I want to customize my avatar, so that I can express my individuality.

*Acceptance Criteria:*

- Users can choose from a variety of avatar styles and accessories.
- Users can upload custom images for their avatars.
- Avatars are displayed in participant lists, profiles, and match screens.

#### Dynamic Event Scheduling

As a host, I want to dynamically schedule matches based on participant availability, so that I can accommodate different time zones and preferences.

*Acceptance Criteria:*

- Participants can input their availability during the application process.
- The platform schedules matches based on participant availability.
- Hosts can manually adjust schedules if needed.

#### Enhanced Fraud Detection

As a platform administrator, I want to implement enhanced fraud detection mechanisms, so that I can protect the integrity of tournaments.

*Acceptance Criteria:*

- The platform monitors for suspicious activities and behaviors.
- Automatic alerts are triggered for potential fraud cases.
- Administrators can investigate and take action against fraudulent accounts.

#### Customizable Match Formats

As a host, I want to define custom match formats and rules, so that I can create unique tournament experiences.

*Acceptance Criteria:*

- Hosts can create custom match formats (e.g., best of three, timed matches).
- Hosts can define specific rules for each match format.
- Participants can view match format details before joining.

#### In-app Streaming Integration

As a participant, I want to stream my matches directly within the app, so that I can share my gameplay with others easily.

*Acceptance Criteria:*

- Participants can start a live stream directly from the tournament interface.
- Viewers can watch live streams within the app.
- The platform supports chat and reactions during live streams.

#### Automated Bracket Generation

As a host, I want to automate the generation of tournament brackets, so that I can save time and reduce manual errors.

*Acceptance Criteria:*

- The platform automatically generates brackets based on participant numbers and seeding rules.
- Hosts can manually adjust brackets if needed.
- Participants can view the bracket layout before the tournament starts.

#### Cross-platform Communication

As a user, I want to communicate with participants on different platforms, so that I can coordinate and interact seamlessly.

*Acceptance Criteria:*

- The platform supports cross-platform messaging between participants.
- Participants receive notifications for messages across platforms.
- Messages are synchronized across all devices.

#### Interactive Match Chat

As a participant, I want to chat with other participants during matches, so that I can engage with the community and discuss gameplay.

*Acceptance Criteria:*

- Participants can access a chat interface during matches.
- The chat interface supports real-time messaging.
- Moderators can monitor and manage chat activity.

#### Community-driven Tournaments

As a user, I want to create and participate in community-driven tournaments, so that I can connect with like-minded players and organize events.

*Acceptance Criteria:*

- Users can create tournaments and invite participants from their community.
- Community members can join tournaments directly from the platform.
- The platform features community leaderboards and rankings.

#### Spectator Mode

As a user, I want to spectate ongoing matches, so that I can watch and learn from other players.

*Acceptance Criteria:*

- Users can join matches as spectators.
- Spectators have access to multiple viewing angles and perspectives.
- Spectators can toggle between different matches and players.

#### Team Performance Metrics

As a team leader, I want access to performance metrics for my team, so that I can track progress and identify areas for improvement.

*Acceptance Criteria:*

- Team leaders can view team-wide statistics such as win rates and average scores.
- Performance metrics are updated in real-time.
- Team leaders receive notifications for significant performance milestones.

#### Player Profiles

As a user, I want a detailed profile page, so that I can showcase my achievements and preferences.

*Acceptance Criteria:*

- Users can customize their profile with personal information, gaming history, and preferences.
- Profile pages display user achievements, tournament participation, and performance metrics.
- Users can choose privacy settings for their profile information.

#### Gamification Elements

As a user, I want gamification elements integrated into the platform, so that I can engage with challenges and earn rewards.

*Acceptance Criteria:*

- The platform features challenges, achievements, and badges for users to unlock.
- Users earn rewards such as credits, exclusive content, and profile enhancements.
- Leaderboards track users' progress and achievements.

#### Customizable Tournament Notifications

As a user, I want to customize my tournament notification preferences, so that I receive updates according to my preferences.

*Acceptance Criteria:*

- Users can choose to receive notifications for tournament invitations, match reminders, and community announcements.
- Notification settings can be adjusted based on frequency and content type.
- Users can opt-in or opt-out of specific notification categories.

#### Social Sharing Integration

As a user, I want to easily share tournament details and achievements on social media platforms, so that I can engage with my network and attract more participants.

*Acceptance Criteria:*

- The platform integrates with popular social media platforms such as Facebook, Twitter, and Instagram.
- Users can share tournament links, match results, and achievements directly from the platform.
- Shared content includes dynamic previews with rich media and metadata.

#### Real-time Match Updates

As a participant, I want to receive real-time updates on match progress and results, so that I can stay informed and make strategic decisions.

*Acceptance Criteria:*

- Participants receive notifications for match start times, score updates, and match outcomes.
- Match updates are delivered in real-time via email, push notifications, and in-app alerts.
- Participants can view live match feeds with real-time commentary and statistics.

#### AI-powered Match Insights

As a participant, I want access to AI-powered match insights, so that I can analyze my gameplay and identify areas for improvement.

*Acceptance Criteria:*

- Participants receive personalized match insights based on gameplay data and performance metrics.
- AI algorithms analyze gameplay patterns, strategies, and decision-making.
- Match insights include actionable recommendations and suggestions for skill enhancement.

#### Community Polls and Surveys

As a host, I want to conduct polls and surveys within the community, so that I can gather feedback and insights for future tournaments and features.

*Acceptance Criteria:*

- Hosts can create polls and surveys with customizable questions and response options.
- Community members can participate in polls and surveys directly from the platform.
- Survey results are compiled and presented to hosts for analysis and decision-making.

#### Automated Match Replays

As a participant, I want access to automated match replays, so that I can review and analyze my gameplay after matches.

*Acceptance Criteria:*

- Match replays are automatically recorded and saved for participants.
- Participants can access match replays from their match history or profile page.
- Match replays include playback controls, annotations, and analysis tools.

#### Customizable Tournament Rulesets

As a host, I want to create and enforce customizable rulesets for my tournaments, so that I can tailor the tournament experience to specific game modes and player preferences.

*Acceptance Criteria:*

- Hosts can define custom rulesets for different tournament formats, game modes, and genres.
- Rulesets include parameters such as match duration, scoring criteria, and banned items.
- Participants must agree to the rulesets before joining tournaments, and violations result in penalties or disqualification.

#### Integrated Coaching and Mentorship

As a participant, I want access to coaching and mentorship services within the platform, so that I can receive guidance and support from experienced players and coaches.

*Acceptance Criteria:*

- The platform features a coaching and mentorship marketplace where participants can find and connect with coaches and mentors.
- Coaches offer personalized training sessions, gameplay analysis, and strategy development.
- Participants can book coaching sessions, track progress, and provide feedback within the platform.

### Functional Requirements

#### Earnings System
Bank variable stored in tournament schema

Bank is updated upon:
Solo user joins solo tournament: add entryFee into bank
Team joins team tournament: add (entryFee * team.size) into bank
Host deposits (if bank not already full): add deposit amount into bank
Tournament ends: distribute earnings, leftover transferred to host

A bank is considered full when it is equal to the total earnings

Host can view bank status in the manage tournament page: current/goal

Host can deposit into bank if it isn’t already full, in the manage page

## Architecture and Design

## Implementation

## Usage

## Testing

## Maintenance

## Contributing

## Appendices