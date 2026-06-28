using System;
using System.ComponentModel.DataAnnotations;

namespace PicasyFamas.Models
{
    public class Player
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid(); // El UUID que pide el diagrama 

        [Required]
        public string Firstname { get; set; } = string.Empty;

        [Required]
        public string Lastname { get; set; } = string.Empty; 

        [Required]
        public int Age { get; set; }
       

        [Required]
        public string Email { get; set; } = string.Empty; 
        [Required]
        public string Password { get; set; } = string.Empty; // Para validar en el Login 

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now; 
    }
}
