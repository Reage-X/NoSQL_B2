import java.time.LocalDateTime;

public class Event {
    private String id;
    private String title;
    private String url;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String location;
    private String organisateurId;
    
    public Event(String title, String description, LocalDateTime startDate, String location) {
        this.title = title;
        this.description = description;
        this.startDate = startDate;
        this.location = location;
    }
    public Event() {}
    
    public String getId()                                   { return id; }
    public String getTitle()                                { return title; }
    public String getUrl()                                  { return url; }
    public String getDescription()                          { return description; }
    public LocalDateTime getStartDate()                     { return startDate; }
    public LocalDateTime getEndDate()                       { return endDate; }
    public String getLocation()                             { return location; }
    public String getOrganisateurId()                       { return organisateurId; }
    

    public void setId(String id)                            { this.id = id; }
    public void setTitle(String title)                      { this.title = title; }
    public void setUrl(String url)                          { this.url = url; }
    public void setDescription(String description)          { this.description = description; }
    public void setStartDate(LocalDateTime startDate)       { this.startDate = startDate; }
    public void setEndDate(LocalDateTime endDate)           { this.endDate = endDate; }
    public void setLocation(String location)                { this.location = location; }
    public void setOrganisateurId(String organisateurId)    { this.organisateurId = organisateurId; }
}
