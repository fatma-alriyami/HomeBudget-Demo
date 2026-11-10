using System.ComponentModel.DataAnnotations;

namespace HomeBudget.API.Models
{
    public class ExpenseCategory
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}