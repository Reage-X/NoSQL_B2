router.patch('/:id/title', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "ID d'événement invalide"
      });
    }

    if (!title || typeof title !== 'string' || validator.isEmpty(title.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Le titre est requis et ne peut pas être vide'
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    event.title = title.trim();
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Titre modifié avec succès',
      data: {
        id: event.id,
        title: event.title
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du titre',
      error: error.message
    });
  }
});

