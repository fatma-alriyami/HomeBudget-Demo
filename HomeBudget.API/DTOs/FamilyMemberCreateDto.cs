using System.ComponentModel.DataAnnotations;

namespace HomeBudget.API.DTOs
{
    public class FamilyMemberCreateDto
    {
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Relationship { get; set; } = string.Empty;
    }
}