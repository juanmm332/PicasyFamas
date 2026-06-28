using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PicasyFamas.Models
{
    public class Game
    {
        [Key]
        public int Id { get; set; } // El ID autoincremental del juego [cite: 238]

        [Required]
        public Guid PlayerId { get; set; } // Relación con el UUID del Player [cite: 246]

        [ForeignKey("PlayerId")]
        public Player? Player { get; set; }

        [Required]
        [StringLength(4)]
        public string SecretNumber { get; set; } = string.Empty; // El número de 4 dígitos a adivinar [cite: 238]

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Required]
        public bool IsFinished { get; set; } = false; // Estado para saber si el juego terminó [cite: 269]
    }
}