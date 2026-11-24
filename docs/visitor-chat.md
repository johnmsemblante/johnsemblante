# Portfolio visitor chat

The portfolio layout mounts a chat widget. The existing admin gate protects the Messages route at `/adminauth/messages/`. Chat uses Firebase Authentication and Cloud Firestore through the browser, so Firebase Hosting can continue serving the static export on Spark.

In both chat boxes, Enter submits the same form as the Send button. Shift+Enter inserts a new line, and Enter used to confirm text in an input method editor stays with the editor. Both send actions use the same validation, delivery confirmation and visitor cooldown.

## Enable and verify

1. In the existing Firebase project, open **Authentication → Sign-in method** and enable **Anonymous**. Keep Google sign-in enabled for administrators.
2. Using an authorized operator account, deploy the reviewed rules with `firebase deploy --only firestore:rules`. The existing automated Hosting workflow deploys the site files. Release Hosting after the rules are active.
3. In a separate browser profile, open the portfolio, select **Chat**, enter test contact details and send a test message with **Available for chat** off. In an approved admin session, verify the thread appears as **Needs reply**. Open it and send a reply. Check that it appears in the visitor’s widget and that the inbox now shows **Replied**.
4. Turn on **Available for chat** in one admin tab and keep that tab visible. Check that the visitor sees the live status. Turn it off and check that the status changes. Repeat by leaving the Messages route and allowing about 90 seconds from the last refresh.
5. Reopen the widget in the original visitor profile and verify that it resumes the saved thread. Open it in another profile and verify that it starts a new conversation. Verify that the signed-out Messages URL requires admin sign-in.

Run the rule tests with the loopback Firestore emulator described in [Admin setup](admin-setup.md). Use only test contact details in a test project. The manual release check requires a configured project and an approved admin session.

## Data and limits

- The widget starts a separate, persistent anonymous Firebase Auth session when opened. The browser profile and site origin determine whether a returning visitor can reopen the thread. Keep anonymous account cleanup disabled if old conversations need to remain resumable. Clearing site data, private browsing and switching domains or devices can prevent resuming a thread.
- The first message creates `chatThreads/{uid}` and a message document in one batch. Later sends append a message and change the inbox status in the same batch. Visitor messages mark a thread as **Needs reply**. An admin chat reply marks it **Replied**. Manual email follow-up opens the owner's mail app and leaves the chat status as it was.
- Rules enforce visitor ownership, approved admin access, sender identity, 2,000-character messages and a two-second visitor interval per thread. Keep test and live chat data out of static content. Chat renders plain text. The inbox and each transcript initially load the latest 30 records and offer older records on demand.
- `chatPublic/availability` stores only a boolean and server timestamp. Use one admin tab for availability. A visible tab refreshes it every 30 seconds while enabled, and visitors treat a timestamp older than 90 seconds as offline.
- The inbox and transcripts use real-time Firestore reads. Messages and availability share the site's existing Spark quota. The per-thread send interval limits rapid posting by one identity. Monitor Firestore/Auth usage because it does not limit a visitor who repeatedly creates new identities.
- Messages and contact details are retained until manually removed. To remove a conversation, use the Firebase console's document deletion that also removes its subcollections and verify its message documents are gone. Chat replies and availability are independent of the Contact form and there are no email or push notifications from this inbox.
