using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PicasyFamas.Models
{
    public class Attempt
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int GameId { get; set; }
        

        [ForeignKey("GameId")]
        public Game? Game { get; set; }

        [Required]
        public int AttemptedNumber { get; set; } // El número que arriesgó [cite: 250, 272]

        [Required]
        public string Pistas { get; set; } = string.Empty; // Guardamos la respuesta ("1 fama y 2 pica", etc.) [cite: 252, 258]

        [Required]
        public DateTime AttemptDate { get; set; } = DateTime.Now;
    }
}
