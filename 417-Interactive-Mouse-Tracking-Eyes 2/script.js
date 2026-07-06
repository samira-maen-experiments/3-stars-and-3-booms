// Initialize base positions for highlights once
document.querySelectorAll(".highlight").forEach((highlight) => {
  if (!highlight.dataset.baseCx) {
    highlight.dataset.baseCx =
      highlight.getAttribute("cx") || highlight.getAttribute("cx");
    highlight.dataset.baseCy =
      highlight.getAttribute("cy") || highlight.getAttribute("cy");
  }
});

document.addEventListener("mousemove", (e) => {
  const eyes = document.querySelectorAll(".eye-group");

  eyes.forEach((eye) => {
    const cx = parseFloat(eye.getAttribute("data-cx"));
    const cy = parseFloat(eye.getAttribute("data-cy"));
    const maxRadius = parseFloat(eye.getAttribute("data-r"));

    // Get eye position relative to viewport
    const rect = eye.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;

    // Calculate angle and distance
    const dx = e.clientX - eyeCenterX;
    const dy = e.clientY - eyeCenterY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxRadius * 3);
    const moveDistance = (distance / (maxRadius * 3)) * maxRadius;

    const newX = cx + Math.cos(angle) * moveDistance;
    const newY = cy + Math.sin(angle) * moveDistance;

    // Update pupil position
    const pupil = eye.querySelector(".pupil");
    if (pupil.tagName === "ellipse") {
      pupil.setAttribute("cx", newX);
      pupil.setAttribute("cy", newY);
    } else if (pupil.tagName === "circle") {
      pupil.setAttribute("cx", newX);
      pupil.setAttribute("cy", newY);
    } else if (pupil.tagName === "path") {
      // For path pupils (hearts and angular), translate the path
      const dx_move = newX - cx;
      const dy_move = newY - cy;
      pupil.style.transform = `translate(${dx_move}px, ${dy_move}px)`;
      pupil.style.transformOrigin = `${cx}px ${cy}px`;
    }

    // Move highlight slightly for depth (half the pupil movement)
    const highlight = eye.querySelector(".highlight");
    if (highlight) {
      const baseCx = parseFloat(highlight.dataset.baseCx);
      const baseCy = parseFloat(highlight.dataset.baseCy);
      const offsetX = (newX - cx) * 0.5; // Move half as much as pupil
      const offsetY = (newY - cy) * 0.5;

      highlight.setAttribute("cx", baseCx + offsetX);
      highlight.setAttribute("cy", baseCy + offsetY);
    }
  });
});