using System.ComponentModel.DataAnnotations;

namespace HomeBudget.API.DTOs
{
    public class ExpenseCategoryUpdateDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(300)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}