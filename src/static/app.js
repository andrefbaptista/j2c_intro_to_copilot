document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.replaceChildren();
      activitySelect.replaceChildren(new Option("-- Select an activity --", ""));

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, details.schedule);
        activityCard.appendChild(schedule);

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(availabilityLabel, `${spotsLeft} spots left`);
        activityCard.appendChild(availability);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("div");
        participantsHeading.className = "participants-heading";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsHeading.appendChild(participantsTitle);

        const participantCount = document.createElement("span");
        participantCount.className = "participant-count";
        participantCount.textContent = details.participants.length;
        participantsHeading.appendChild(participantCount);
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participant-list";
        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "empty-participants";
          emptyMessage.textContent = "No one has signed up yet";
          participantsList.appendChild(emptyMessage);
        } else {
          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            participant.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;
            participant.appendChild(participantEmail);

            const deleteButton = document.createElement("button");
            deleteButton.className = "participant-delete";
            deleteButton.type = "button";
            deleteButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
            deleteButton.title = `Unregister ${email}`;

            const deleteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            deleteIcon.setAttribute("viewBox", "0 0 24 24");
            deleteIcon.setAttribute("aria-hidden", "true");
            deleteIcon.setAttribute("focusable", "false");

            const deletePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            deletePath.setAttribute("d", "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6");
            deletePath.setAttribute("fill", "none");
            deletePath.setAttribute("stroke", "currentColor");
            deletePath.setAttribute("stroke-linecap", "round");
            deletePath.setAttribute("stroke-linejoin", "round");
            deletePath.setAttribute("stroke-width", "2");
            deleteIcon.appendChild(deletePath);
            deleteButton.appendChild(deleteIcon);

            deleteButton.addEventListener("click", async () => {
              deleteButton.disabled = true;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Failed to unregister participant");
                }

                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                await fetchActivities();
              } catch (error) {
                messageDiv.textContent = error.message || "Failed to unregister participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error unregistering participant:", error);
                deleteButton.disabled = false;
              }
            });

            participant.appendChild(deleteButton);
            participantsList.appendChild(participant);
          });
        }
        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
