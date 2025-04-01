import { renderToStaticMarkup } from "react-dom/server"



type TemplateType = "welcome" | "quiz-promo" | "course-promo" | "reengagement"

export async function getEmailTemplate(type: TemplateType, data: any) {
  let component

  switch (type) {
    case "welcome":
      component = <WelcomeEmail name={data.name} />
      break
    case "quiz-promo":
      component = <QuizPromoEmail name={data.name} preferences={data.preferences} />
      break
    case "course-promo":
      component = <CoursePromoEmail name={data.name} recommendedCourses={data.recommendedCourses} />
      break
    case "reengagement":
      component = <ReengagementEmail name={data.name} />
      break
    default:
      throw new Error(`Unknown email template type: ${type}`)
  }

  const html = renderToStaticMarkup(component)

  return {
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${html}</body></html>`,
  }
}

