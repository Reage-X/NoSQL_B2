import java.util.ArrayList;
import java.util.Comparator;

public class Compte
{
    private String user_name;
    private String MDP;
    private String email;
    private ArrayList<Integer> Id_Events;

    public Compte(String user_name, String MDP, String email) {
        this.user_name = user_name;
        this.MDP = MDP;
        this.email = email;
    }
    public Compte() {}

    public String getUser_name()                                    { return user_name; }
    public String getMDP()                                          { return MDP; }
    public String getEmail()                                        { return email; }
    public ArrayList<Integer> getId_Events()                        { return Id_Events; }
    public Integer getId_Events(int index) {
        if (Id_Events != null && index >= 0 && index < Id_Events.size()) {
            return Id_Events.get(index);
        }
        return null;
    }


    public void setUser_name(String user_name)                      { this.user_name = user_name; }
    public void setMDP(String MDP)                                  { this.MDP = MDP; }
    public void setEmail(String email)                              { this.email = email; }
    public void setId_Events(ArrayList<Integer> Id_Events)          { this.Id_Events = Id_Events; }
    public void addId_Events(Integer nouveauId_Event) {
        if (this.Id_Events == null) {
            this.Id_Events = new ArrayList<>();
        }
        if (nouveauId_Event >= 0) {
            this.Id_Events.add(nouveauId_Event);
            this.Id_Events.sort(Comparator.reverseOrder());
        }
    }
}
