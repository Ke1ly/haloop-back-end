## Project Overview
Haloop is a work-exchange platform that helps volunteers easily find suitable hosts through advanced filters and real-time chat. </br>
Volunteers can subscribe to custom filters for instant notifications and receive personalized recommendations - instead of browsing endless social media posts. </br>
Demo: https://haloop.yunn.space</br>

You're welcome to use the pre-registered trial account:
> **Helper account**</br>
> email: visitor2025@haloop.io</br>
> password: Visitor2025</br>

> **Host account**</br>
> email: hostvisitor2025@haloop.io</br>
> password: hostVisitor2025</br>

## Main Features
**✴︎ Host Post Upload**</br>
Hosts can upload text and images to clearly present work details and living conditions.

**✴︎ Advanced Search Filters**</br>
Volunteers can filter opportunities by location, dates, group size, work hours, minimum stay, accommodation, job type, environment, and special experiences.

**✴︎ Subscription & Real-Time Notifications**</br>
Volunteers can subscribe to custom filters and get notified instantly when matching posts are published.

**✴︎ Personalized Daily Recommendations**</br>
The platform recommends daily posts tailored to volunteer preferences.

**✴︎ Real-Time Chat**</br>
Volunteers and hosts can confirm details efficiently via built-in chat.

## Technical Highlights
◆ **Real-time Communication** </br>
Socket.IO with Redis adapter enables seamless real-time chat and notifications across containers.

◆ **Asynchronous Processing** </br>
BullMQ + Redis asynchronously handles subscription matching through a dedicated worker container, utilizing Elasticsearch Percolator for efficient post matching.

◆ **Intelligent Recommendations** </br>
Multi-criteria similarity queries powered by Elasticsearch, with automated daily personalization via Cron jobs, results cached in Redis for optimal performance.

◆ **DevOps Automation** </br>
Complete CI/CD pipeline implemented with GitHub Actions for streamlined deployment workflows.

◆ **Containerized Architecture** </br>
Docker Compose coordinates backend service, worker, and Nginx reverse proxy for scalable deployment.

◆ **Cloud Infrastructure** </br>
AWS-native integration with VPC networking and security groups, leveraging S3 + CloudFront, OpenSearch, ElastiCache, and RDS.


## Tech Stack
### Backend & Core
⦁ Node.js + Express (TypeScript)</br>
⦁ Prisma ORM</br>
⦁ Socket.IO (WebSocket)</br>
⦁ BullMQ + Redis</br>
⦁ JWT Authentication</br>
⦁ Cron Jobs

### Data & Search
⦁ MySQL (AWS RDS)</br>
⦁ Elasticsearch (OpenSearch)</br>
⦁ Redis (Elasticache)

### Infrastructure & Deployment
⦁ Docker & Docker Compose</br>
⦁ Nginx Reverse Proxy</br>
⦁ GitHub Actions CI/CD </br>
⦁ AWS EC2, S3, CloudFront

### Frontend
⦁ TypeScript</br>
⦁ HTML</br>
⦁ CSS

## Architecture Design
![image](https://github.com/Ke1ly/haloop-back-end/blob/main/docs/images/architecture-design.png)
