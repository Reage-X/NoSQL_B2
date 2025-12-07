public class Event {
    private String Titre;
    private String png_vid;
    private String description;
    
    public Event(String Titre, String png_vid, String description) {
        this.Titre = Titre;
        this.png_vid = png_vid;
        this.description = description;
    }
    public Event() {}
    
    public String getTitre()                            { return Titre; }
    public String getPng_vid()                          { return png_vid; }
    public String getDescription()                      { return description; }
    
    public void setDescription(String description)      { this.description = description; }
    public void setTitre(String Titre)                  { this.Titre = Titre; }
    public void setPng_vid(String png_vid)              { this.png_vid = png_vid; }
}
