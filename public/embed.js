;(() => {
    // Find all quiz embed elements
    const embeds = document.querySelectorAll(".courseai-quiz-embed")
  
    if (!embeds.length) return
  
    // Create a style element
    const style = document.createElement("style")
    style.textContent = `
      .courseai-quiz-embed iframe {
        width: 100%;
        border: none;
        min-height: 600px;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
    `
    document.head.appendChild(style)
  
    // Process each embed
    embeds.forEach((embed) => {
      const quizId = embed.getAttribute("data-quiz-id")
      const theme = embed.getAttribute("data-theme") || "light"
  
      if (!quizId) {
        console.error("CourseAI Quiz Embed: Missing quiz ID")
        return
      }
  
      // Create iframe
      const iframe = document.createElement("iframe")
      iframe.src = `https://courseai.dev/embed/${quizId}?theme=${theme}`
      iframe.allow = "fullscreen"
      iframe.title = "CourseAI Quiz"
  
      // Add message listener for iframe height adjustments
      window.addEventListener("message", (e) => {
        if (e.origin !== "https://courseai.dev") return
  
        try {
          const data = JSON.parse(e.data)
          if (data.type === "resize" && data.quizId === quizId) {
            iframe.style.height = `${data.height}px`
          }
        } catch (err) {
          // Ignore invalid messages
        }
      })
  
      // Replace the placeholder with the iframe
      embed.innerHTML = ""
      embed.appendChild(iframe)
    })
  })()
  
  