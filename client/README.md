# Tourney

Version: 1.0

Backend API repo: https://github.com/waleedhussein4/tourney-backend

## Table of Contents

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

#### Becoming a Host

As a user, I want to become a host and create tournaments, so that I can organize competitions and manage events.

*Acceptance Criteria:*

- Users can upgrade their account to host status.
- Users pay a one-time fee to become a host using credits.

#### Changing Tournament Details Before Start

As a host, I want to modify certain details of the tournament before it starts, so that I can ensure everything is set up correctly.

*Acceptance Criteria:*

- The host can change the tournament title, description, start date, end date, and application form before the tournament starts.

#### Changing Tournament Details After Start

As a host, I want to modify specific details of the tournament after it starts, so that I can accommodate any necessary adjustments.

*Acceptance Criteria:*

- The host can only post updates and update scores and elimination statuses during the tournament.

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
- The team leader can invite new members to the team.

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
- Users are charged a 5% fee for withdrawals.

#### Host Notifications

As a host, I want to receive notifications about important events, so that I can manage my tournament effectively.

*Acceptance Criteria:*

- Hosts receive notifications when new applications are submitted.
- Hosts receive notifications when users or teams have joined the tournament.

#### User Notifications

As a user, I want to receive notifications about my applications, tournament statuses, and social interactions, so that I stay informed about my participation.

*Acceptance Criteria:*

- Users receive notifications when their application is accepted or rejected.
- Users receive notifications about tournament start times and updates.
- Users receive notifications about tournament updates.
- Users can custommize notification preferences.
- Users receive notifications about friend requests
- Users receive notifications about team invitations
- Users receive notifications about messages

#### Tournament Search and Filters

As a user, I want to search and filter tournaments, so that I can find suitable tournaments to join.

*Acceptance Criteria:*

- Users can search tournaments by title, description, category, type, entry fees, and accessibility.

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

#### Customizing User Profiles

As a user, I want to customize my profile, so that I can personalize my experience on the platform.

*Acceptance Criteria:*

- Users can update their profile picture and bio.
- Users can view their credits balance and transaction history.

#### Guest Mode for Spectators

As a visitor, I want to browse tournaments and watch live streams without creating an account, so that I can enjoy the content as a guest.

*Acceptance Criteria:*

- Visitors can view public tournament details.
- Visitors are prompted to create an account only when attempting to participate or apply to a tournament.

#### Tournament Promotion

As a host, I want to promote my tournament on the platform, so that I can attract more participants.

*Acceptance Criteria:*

- Hosts can create promotional banners for their tournaments.
- Hosts can feature their tournaments on the homepage or in relevant categories.

#### Team Communication Tools

As a team leader, I want to have communication tools for my team, so that we can coordinate effectively.

*Acceptance Criteria:*

- Teams have access to a private chat room within the platform.

#### Social Features and Friend Lists

As a user, I want to add friends and interact socially on the platform, so that I can enhance my community experience.

*Acceptance Criteria:*

- Users can send and accept friend requests.
- Users can view friends' tournament participation and achievements.
- Users can chat with friends directly within the platform.

#### Automated Bracket Generation

As a host, I want to automate the generation of tournament brackets, so that I can save time and reduce manual errors.

*Acceptance Criteria:*

- The platform automatically generates brackets based on participant numbers and seeding rules.
- Hosts can manually adjust brackets if needed.
- Participants can view the bracket layout before the tournament starts.

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
