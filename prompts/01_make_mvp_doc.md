Make a markdown file with steps to achieve the following. Don't write any code yet.

The purpose of this app is for admins to give concert and other event tickets to teachers. When the admin gets the ticket in hand, they will need to create a ticket object in our system and then our app sends offers for that ticket, by email or text, to users in their domains. A user will receive a text or email with a link, then click that link and see buttons for Accept and Decline. The tickets themselves are outside our system - they may be paper or PDF that the admin sends by mail or email to the user. In our system, admins will mark the ticket as sent.

Admins will need a button to create a ticket object. Creating a ticket means entering a short description, number of tickets, a date, time, location (short text), ADA accessible yes/no, parking included yes/no, estimated total market value at time of donation. Optionally: Section, row, seat(s), notes.

Viewing tickets: There should be prominent indicators of each ticket's status: Unclaimed, claimed, and sent. Sent tickets should be the least prominent, probably not visible by default, because usually there is nothing more to be done with those.

Offering tickets: Admins will need an offering UI, where they select an unclaimed ticket, select a domain (if they have more than one), select a method, and then select one or more users. They should be able to see the name and preferences of each user. After selecting users, they click send, and either emails or texts go out.

Ticket status: When first created, a ticket is in status Unclaimed. After it gets offered, when a user clicks Accept, the status automatically changes to Claimed. Somewhere in the database it is recorded which user claimed the ticket. An admin needs to be able to change the status manually between Unclaimed, Claimed and Sent.

When a ticket is offered, a user receives an email or text with some details about the ticket and a personalized link to our website. When they click that link, they do not need to log in - we know who they are from the link. If the ticket is still in unclaimed status, they see 1. their own name 2. ALL details about the ticket 3. Accept and Decline buttons

A ticket may be offered to more than one user at a time. The first user to click Accept claims the ticket, and subsequent users will not see an Accept button, but rather a message saying the ticket has been claimed. If the ticket has been claimed between the time the user opened the link and the time they clicked Accept, they see a message indicating that.

All actions should be logged in the database with timestamps, and the admin should be able to see a list of actions with each ticket (maybe in an expanded section. does not need to be prominent). Actions include: Ticket created, ticket offered to John Doe, ticket offered to Jane Doe, ticket accepted by Jane Doe, ticket marked as sent.

Again, don't write any code. This is just to make a markdown file with steps to achieve.
