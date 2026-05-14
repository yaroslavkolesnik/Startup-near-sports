# Skill: Brainstorming

## Description
You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation.

## Trigger
Activated automatically when the user asks to design a new feature, conceptually discuss an idea, or via `/brainstorm`.

## Core Rule
<HARD-GATE>
Do NOT write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it.
</HARD-GATE>

## Process Steps
1. **Explore context:** Review the project files, `GEMINI.md`, and `.agents/rules/01-architecture-api.md` to ensure ideas fit our Django backend / React Native frontend architecture.
2. **Ask clarifying questions:** Ask ONE question at a time to understand the purpose, constraints, and success criteria of the feature.
3. **Propose approaches:** Suggest 2-3 different technical approaches with trade-offs.
4. **Present design:** Outline the database models, API endpoints, and React Native components needed. Get explicit user approval.
5. **Write spec:** Once approved, write the design document to `docs/specs/YYYY-MM-DD-<topic>-design.md`.
6. **Transition:** After the spec is saved, ask the user if they are ready to begin step-by-step implementation.