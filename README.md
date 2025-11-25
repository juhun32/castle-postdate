### Californian Temple

New product in dev

<del>
A full-stack web application designed to help couples stay connected and organized through a shared calendar and daily check-in system.

---

### Technology

-   **frontend**: Next.js (React, TypeScript), Tailwind, Vercel
-   **REST & storage**: Go, Firestore, Cloudflare R2
-   **deployment**: GCP & Docker/Docker-Compose

---

### Architectural Decisions

-   **Why Go for the backend?**

    performance. especially thinking about a serverless deployment. starts up incredibly fast and doesn't hog memory. For an API that needs to be responsive, and where multiple users might be making requests at once, Go's built-in handling of concurrency is a huge performance advantage

-   **Why Next.js for the frontend?**

    intuitive and easy to work with. amazing documentation. It also gives you server-side rendering out of the box, so the app feels fast for users from the very first page load. Also deploying it on Vercel is amazingly easy

-   **Why Firestore for the database?**

    real-time capabilities and cost. For a shared app like this, when one partner adds an event, the other should see it instantly without needing to refresh. Being a serverless NoSQL database, I don't have to manage servers. Very generous free tier

-   **Why Cloudflare R2 for file storage?**

    avoiding the bandwidth bills. R2 has zero egress fees, which means I'm not charged when users view the images they've uploaded. For a platform that's meant to be media-rich, had to go with R2. It also uses the same S3-compatible API as AWS, so I could use well-documented tools

---

### Features

-   **Shared Calendar**:

    A calendar that both partners can access and modify, with real-time updates.

-   **Daily Check-ins**:

    A system for partners to check in with each other, fostering communication and connection.

-   **Event Reminders**:

    Notifications for upcoming events or check-ins.

-   **Image Uploads**:

    Ability to upload and share images, stored efficiently using Cloudflare R2.

---

### Future Improvements

-   **Mobile App**:

    Developing a mobile version of the app for iOS

-   **Advanced Analytics**:

    Providing users with insights into their relationship patterns based on calendar and check-in data

-   **Integration with Other Services**:

    Such as Google Calendar, to import/export events

-   **AI-Powered Suggestions**:

    For date ideas, reminders, and other personalized content to enhance user engagement
</del>
