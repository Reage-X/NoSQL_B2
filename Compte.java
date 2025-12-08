import java.util.ArrayList;

public class Compte
{
    private String id;
    private String username;
    private String password;
    private String email;
    private ArrayList<String> eventIds;

    public Compte(String username, String password, String email) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.eventIds = new ArrayList<>();
    }
    public Compte() {}


    public String getId()                                           { return id; }
    public String getUsername()                                     { return username; }
    public String getPassword()                                     { return password; }
    public String getEmail()                                        { return email; }
    public ArrayList<String> getEventIds()                          { return eventIds; }
    public String getEventIds(int index) {
        if (eventIds != null && index >= 0 && index < eventIds.size()) {
            return eventIds.get(index);
        }
        return null;
    }
    

    public void setId(String id)                                    { this.id = id; }
    public void setUsername(String username)                        { this.username = username; }
    public void setPassword(String password)                        { this.password = password; }
    public void setEmail(String email)                              { this.email = email; }
    public void setEventIds(ArrayList<String> eventIds)             { this.eventIds = eventIds; }
    public void addEventIds(String nouveauId_Event) {
        if (this.eventIds == null) {
            this.eventIds = new ArrayList<>();
        }
        if (nouveauId_Event != null && !this.eventIds.contains(nouveauId_Event)) {
            this.eventIds.add(nouveauId_Event);
        }
    }
}
