# Skill: Skill Creator

## Description
A meta-skill to help the user create new skills for the project. 

## Trigger
Activated when the user types: `/new-skill [SkillName]`

## Steps
1. **Analyze:** Ask the user what the new skill should do and when it should trigger.
2. **Review Context:** Read the project standards in `GEMINI.md` and `.agents/rules/01-architecture-api.md` to ensure the new skill aligns with our Django/React Native architecture.
3. **Draft:** Create a Markdown structure for the new skill (using `# Skill`, `## Description`, `## Trigger`, and `## Steps`).
4. **Save:** Save the generated file strictly in the `.agents/skills/` directory.